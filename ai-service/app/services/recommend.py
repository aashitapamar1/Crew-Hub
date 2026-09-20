from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models.schemas import RecommendRequest, RecommendationResult


def recommend_freelancers(payload: RecommendRequest) -> list[RecommendationResult]:
    required_text = " ".join(payload.requiredSkills).lower()
    candidate_texts = [" ".join(c.skills).lower() or "none" for c in payload.candidates]

    corpus = [required_text or "none"] + candidate_texts
    vectorizer = TfidfVectorizer()
    matrix = vectorizer.fit_transform(corpus)

    similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()

    max_pending = max((c.pendingTasks for c in payload.candidates), default=0) or 1

    results = []
    for candidate, skill_match in zip(payload.candidates, similarities):
        workload_penalty = candidate.pendingTasks / max_pending
        score = round(float(skill_match) * 0.7 + (1 - workload_penalty) * 0.3, 4)
        results.append(
            RecommendationResult(
                id=candidate.id,
                name=candidate.name,
                score=score,
                skillMatch=round(float(skill_match), 4),
                workloadPenalty=round(workload_penalty, 4),
            )
        )

    return sorted(results, key=lambda r: r.score, reverse=True)
