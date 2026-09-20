import numpy as np
from sklearn.cluster import KMeans

from app.models.schemas import WorkloadRequest, WorkloadResult


def _tier_for_centroid(value: float) -> str:
    if value < 1:
        return "UNDER_UTILIZED"
    if value < 5:
        return "NORMAL"
    return "OVERLOADED"


def analyze_workload(payload: WorkloadRequest) -> list[WorkloadResult]:
    entries = payload.freelancers
    if not entries:
        return []

    pending = np.array([[e.pendingTasks] for e in entries], dtype=float)
    distinct_values = len(set(e.pendingTasks for e in entries))
    n_clusters = min(3, distinct_values)

    if n_clusters < 2:
        tier = _tier_for_centroid(entries[0].pendingTasks)
        return [
            WorkloadResult(id=e.id, name=e.name, pendingTasks=e.pendingTasks, workload=tier)
            for e in entries
        ]

    kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    cluster_ids = kmeans.fit_predict(pending)
    centroids = kmeans.cluster_centers_.flatten()

    results = []
    for entry, cluster_id in zip(entries, cluster_ids):
        tier = _tier_for_centroid(centroids[cluster_id])
        results.append(
            WorkloadResult(id=entry.id, name=entry.name, pendingTasks=entry.pendingTasks, workload=tier)
        )

    return results
