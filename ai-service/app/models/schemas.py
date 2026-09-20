from typing import List, Optional
from pydantic import BaseModel


class FreelancerCandidate(BaseModel):
    id: str
    name: str
    skills: List[str] = []
    experienceYears: float = 0
    pendingTasks: int = 0
    hourlyRate: Optional[float] = None


class RecommendRequest(BaseModel):
    requiredSkills: List[str] = []
    candidates: List[FreelancerCandidate]


class RecommendationResult(BaseModel):
    id: str
    name: str
    score: float
    skillMatch: float
    workloadPenalty: float


class ProjectDelayRequest(BaseModel):
    totalTasks: int
    completedTasks: int
    overdueTasks: int
    daysElapsed: float
    daysRemaining: float


class ProjectDelayResult(BaseModel):
    riskScore: float
    riskLevel: str


class WorkloadEntry(BaseModel):
    id: str
    name: str
    assignedTasks: int
    completedTasks: int
    pendingTasks: int


class WorkloadRequest(BaseModel):
    freelancers: List[WorkloadEntry]


class WorkloadResult(BaseModel):
    id: str
    name: str
    pendingTasks: int
    workload: str
