import { evaluateScript } from "../../script-engine";

export async function POST(request: Request) {
  const payload = (await request.json()) as { answers?: Record<string, string>; questionIds?: string[]; genre?: string; studioLevel?: number };
  try {
    const report = evaluateScript(payload.answers ?? {}, payload.questionIds ?? [], payload.genre ?? "犯罪悬疑", payload.studioLevel ?? 1);
    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "剧本评估失败" }, { status: 400 });
  }
}
