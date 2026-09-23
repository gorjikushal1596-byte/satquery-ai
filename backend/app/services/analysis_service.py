def analyze(plan):
    intent = plan["intent"]

    if intent == "vegetation_change":
        analysis = {
            "metric": "NDVI change",
            "change_percentage": 12.4,
            "trend": "decrease",
            "period": f'{plan["start_year"]} → {plan["end_year"]}',
        }
        explanation = (
            f"Demo analysis indicates a 12.4% vegetation-index change in "
            f'{plan["region"]} between {plan["start_year"]} and {plan["end_year"]}.'
        )
        confidence = 0.87
    elif intent == "water_analysis":
        analysis = {
            "metric": "water-area change",
            "change_percentage": 8.1,
            "trend": "increase",
            "period": f'{plan["start_year"]} → {plan["end_year"]}',
        }
        explanation = "Demo water analysis completed using the mock provider."
        confidence = 0.82
    else:
        analysis = {
            "metric": "change score",
            "change_percentage": 6.5,
            "trend": "detected",
            "period": f'{plan["start_year"]} → {plan["end_year"]}',
        }
        explanation = "Demo satellite analysis completed. A real provider can be plugged in later."
        confidence = 0.75

    return {"analysis": analysis, "explanation": explanation, "confidence": confidence}
