def solve_roster(data):
    grid_available = data.get("grid_available", [])
    generator_capacity = data.get("generator_capacity_kw", 20)
    fuel_budget = data.get("fuel_budget_litres", 17.0)
    shops = data.get("shops", [])
    fuel_table = data.get("fuel_table", [])
    max_consecutive_dark = data.get("max_consecutive_dark", 2)

    for shop in shops:
        if shop.get("kw", 0) <= 0:
            return {
                "status": "invalid_input",
                "message": f"Invalid input: Shop '{shop.get('id')}' has non-positive kW."
            }

    roster_output = []
    total_value = 0
    total_fuel = 0.0
    dark_counts = {shop["id"]: 0 for shop in shops if shop.get("type") == "normal"}

    sorted_fuel_table = sorted(fuel_table, key=lambda x: x["load_kw"])

    def get_fuel_for_load(load_kw):
        if load_kw <= 0:
            return 0.0
        for entry in sorted_fuel_table:
            if load_kw <= entry["load_kw"]:
                return entry["litres_per_hour"]
        if sorted_fuel_table:
            return sorted_fuel_table[-1]["litres_per_hour"]
        return 0.0

    for hour_idx, grid_on in enumerate(grid_available):
        if grid_on:
            for shop_id in dark_counts:
                dark_counts[shop_id] = 0
            continue

        mandatory_shops = [s for s in shops if s.get("type") == "mandatory"]
        normal_shops = [s for s in shops if s.get("type") == "normal"]

        normal_shops.sort(
            key=lambda s: s.get("value_per_slot", [0]*10)[hour_idx] / max(s.get("kw", 1), 1),
            reverse=True
        )

        powered = [s["id"] for s in mandatory_shops]
        current_load = sum(s.get("kw", 0) for s in mandatory_shops)
        dark_entries = []

        for shop in normal_shops:
            shop_id = shop["id"]
            shop_kw = shop.get("kw", 0)
            
            will_exceed_capacity = (current_load + shop_kw > generator_capacity)
            will_break_consecutive = (dark_counts.get(shop_id, 0) >= max_consecutive_dark)

            if will_break_consecutive and not will_exceed_capacity:
                powered.append(shop_id)
                current_load += shop_kw
                dark_counts[shop_id] = 0
            elif not will_exceed_capacity:
                test_load = current_load + shop_kw
                test_fuel_rate = get_fuel_for_load(test_load)
                if total_fuel + test_fuel_rate <= fuel_budget:
                    powered.append(shop_id)
                    current_load += shop_kw
                    dark_counts[shop_id] = 0
                else:
                    dark_counts[shop_id] += 1
                    dark_entries.append({
                        "id": shop_id,
                        "reason": f"Shop kept dark to stay within fuel budget limit (Used {total_fuel:.1f}L / Budget {fuel_budget}L)."
                    })
            else:
                dark_counts[shop_id] += 1
                reason = "Shop kept dark due to generator capacity limit."
                if will_break_consecutive:
                    reason = "Forced dark limit reached, but capacity exceeded."
                dark_entries.append({
                    "id": shop_id,
                    "reason": reason
                })

        hour_fuel = get_fuel_for_load(current_load)
        total_fuel += hour_fuel

        hour_value = 0
        for shop in shops:
            if shop["id"] in powered:
                vals = shop.get("value_per_slot", [0]*10)
                if hour_idx < len(vals):
                    hour_value += vals[hour_idx]
        total_value += hour_value

        roster_output.append({
            "hour": hour_idx,
            "powered": powered,
            "dark": dark_entries
        })

    per_shop_dark = {shop["id"]: 0 for shop in shops}
    for r in roster_output:
        for d in r["dark"]:
            per_shop_dark[d["id"]] += 1

    status = "ok"
    if total_fuel > fuel_budget + 0.05:
        status = "infeasible"

    return {
        "status": status,
        "roster": roster_output,
        "value_total": total_value,
        "fuel_total_litres": round(total_fuel, 2),
        "per_shop_dark_hours": per_shop_dark
    }