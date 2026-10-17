import express from "express";
import authRoutes from "./routes/auth.routes.js";
import campaignRoutes from "./routes/campaigns.routes.js";
import donationsRoutes from "./routes/donations.routes.js";

const app = express();

app.use(express.json());

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);

app.use(campaignRoutes);
app.use(donationsRoutes);

export default app;
