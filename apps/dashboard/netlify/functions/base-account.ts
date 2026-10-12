import { loadBaseAccount, readAddress } from "../../server/baseAccount";

export default async (req: Request) => {
  const address = readAddress(new URL(req.url).searchParams.get("address"));
  if (!address) return Response.json({ error: "Invalid address" }, { status: 400 });
  try {
    return Response.json(await loadBaseAccount(address));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Base request failed";
    return Response.json({ error: message }, { status: 502 });
  }
};
