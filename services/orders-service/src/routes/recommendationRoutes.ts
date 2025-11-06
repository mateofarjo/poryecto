import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { getPersonalizedRecommendations } from "../services/recommendationService";

const router = Router();

router.get("/personal", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email;
    // Tailor suggestions using past orders owned by the active principal.
    const recommendations = await getPersonalizedRecommendations(userEmail);
    res.json({ recommendations });
  } catch (error) {
    console.error("[orders-service] Recommendation error", error);
    res.status(500).json({ message: "Could not generate recommendations" });
  }
});

export default router;
