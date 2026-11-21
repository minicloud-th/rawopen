import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";

export type ShowcaseWork = { title: string; description: string; image: string };
export type Showcase = { displayName: string; bio: string; photoURL: string; storeName: string; storeBio: string; works: ShowcaseWork[] };
export type ShowcaseSecurity = { emailVerified: boolean; mfaEnabled: boolean; storeVerified: boolean; sellerApproved: boolean };
export type ShowcaseResult = { showcase: Showcase; security: ShowcaseSecurity };
export const emptyShowcase: Showcase = { displayName: "", bio: "", photoURL: "", storeName: "", storeBio: "", works: [] };
export const pendingSecurity: ShowcaseSecurity = { emailVerified: false, mfaEnabled: false, storeVerified: false, sellerApproved:false };
type State = { data: ShowcaseResult | null; loading: boolean; error: string; saving: boolean };

async function request(user: User, method: "GET" | "PUT", body?: Showcase, signal?: AbortSignal): Promise<ShowcaseResult> {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/member-profile", { method, headers: { Authorization: `Bearer ${idToken}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal, cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 401 ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" : "โหลดหรือบันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
  return await response.json() as ShowcaseResult;
}

export function useShowcase(user?: User | null, preview?: ShowcaseResult) {
  const [state, setState] = useState<State>({ data: preview || null, loading: Boolean(user), error: "", saving: false });
  const reload = useCallback(async () => {
    if (preview) { setState({ data: preview, loading: false, error: "", saving: false }); return; }
    if (!user) { setState({ data: null, loading: false, error: "", saving: false }); return; }
    setState(previous => ({ ...previous, loading: true, error: "" }));
    try { const data = await request(user, "GET"); setState({ data, loading: false, error: "", saving: false }); }
    catch (error) { setState(previous => ({ ...previous, loading: false, error: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ" })); }
  }, [user, preview]);
  useEffect(() => {
    if (preview) { setState({ data: preview, loading: false, error: "", saving: false }); return; }
    if (!user) { setState({ data: null, loading: false, error: "", saving: false }); return; }
    const controller = new AbortController();
    setState({ data:null,loading:true,error:"",saving:false });
    void request(user, "GET", undefined, controller.signal).then(data => {if(!controller.signal.aborted)setState({ data, loading: false, error: "", saving: false })}).catch(error => {
      if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ" }));
    });
    return () => controller.abort();
  }, [user, preview]);
  const save = useCallback(async (showcase: Showcase) => {
    if (preview) { setState({ data: { ...preview, showcase }, loading: false, error: "", saving: false }); return; }
    if (!user) throw new Error("กรุณาเข้าสู่ระบบเพื่อแก้ไขโปรไฟล์");
    setState(previous => ({ ...previous, saving: true, error: "" }));
    try { const data = await request(user, "PUT", showcase); setState({ data, loading: false, error: "", saving: false }); }
    catch (error) { setState(previous => ({ ...previous, saving: false, error: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" })); throw error; }
  }, [user, preview]);
  return { ...state, reload, save };
}
