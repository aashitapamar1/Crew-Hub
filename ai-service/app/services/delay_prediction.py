import numpy as np
from sklearn.linear_model import LogisticRegression

from app.models.schemas import ProjectDelayRequest, ProjectDelayResult


def _synthetic_training_data(n: int = 2000, seed: int = 42):
    rng = np.random.default_rng(seed)

    completion_rate = rng.uniform(0, 1, n)
    overdue_rate = rng.uniform(0, 1, n)
    time_progress = rng.uniform(0, 1, n)

    # A project is behind schedule when it has used up more of its timeline
    # than it has completed of its work, or when it already has overdue tasks.
    schedule_gap = time_progress - completion_rate
    delay_score = schedule_gap * 0.6 + overdue_rate * 0.4
    noise = rng.normal(0, 0.08, n)
    labels = (delay_score + noise > 0.15).astype(int)

    features = np.column_stack([completion_rate, overdue_rate, time_progress])
    return features, labels


_MODEL = LogisticRegression()
_X_TRAIN, _Y_TRAIN = _synthetic_training_data()
_MODEL.fit(_X_TRAIN, _Y_TRAIN)


def predict_delay(payload: ProjectDelayRequest) -> ProjectDelayResult:
    total = max(payload.totalTasks, 1)
    completion_rate = payload.completedTasks / total
    overdue_rate = payload.overdueTasks / total

    total_span = payload.daysElapsed + payload.daysRemaining
    time_progress = payload.daysElapsed / total_span if total_span > 0 else 1.0
    time_progress = min(max(time_progress, 0), 1)

    features = np.array([[completion_rate, overdue_rate, time_progress]])
    risk_score = float(_MODEL.predict_proba(features)[0][1])

    if risk_score >= 0.66:
        risk_level = "HIGH"
    elif risk_score >= 0.33:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return ProjectDelayResult(riskScore=round(risk_score, 4), riskLevel=risk_level)
