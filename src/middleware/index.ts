// @ts-ignore
import { defineMiddleware } from "astro:middleware";
import { supabase } from "../lib/supabase";
import micromatch from "micromatch";
import { getDomain } from "../common/constants";
import { publicRoutes, redirectRoutes } from "./routes";

const domain: string = getDomain();
export const onRequest = defineMiddleware(async ({ locals, url, cookies, redirect }: any, next: any) => {
  if(url.toString().includes('/api/') || url.toString().includes('/_actions/')) return next();
  console.log(url.toString())
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (refreshToken?.value && accessToken?.value) {
    const { data, error } = await supabase.auth.setSession({ refresh_token: refreshToken?.value, access_token: accessToken?.value });
    if (error) {
      cookies.delete("sb-access-token", { path: "/", domain });
      cookies.delete("sb-refresh-token", { path: "/", domain });
      cookies.delete("access-codes", { path: "/", domain });
      return redirect("/authentication/signin");
    }
    locals.user = data.user;
    locals.email = data.user?.email;
    cookies.set("sb-access-token", data?.session?.access_token, { sameSite: "strict", domain, path: "/", secure: true });
    cookies.set("sb-refresh-token", data?.session?.refresh_token, { sameSite: "strict", domain, path: "/", secure: true });

    const role = cookies.get("role");
    if (role.value !== 'null') {
      const { id, name, menu_ids } = JSON.parse(role.value);
      locals.roleId = id;
      locals.roleName = name;
      locals.accessCodes = menu_ids;
    }
π
    const store = cookies.get("store");
    if (store.value !== 'null') {
      const { id, name, package_id, package_name } = JSON.parse(store.value);
      locals.storeId = id;
      locals.storeName = name;
      locals.packageId = package_id;
      locals.packageName = package_name;
    }
    // Protected routes 
    const menus = cookies.get("menus");
    if (menus.value !== 'null') {
      const protectedMenus = JSON.parse(menus.value);
      if (!micromatch.isMatch(url.pathname, publicRoutes) && !micromatch.isMatch(url.pathname, redirectRoutes)) {
        const menu = protectedMenus.find((x: any) => x.link === url.pathname.substring(1));
        if (menu?.value && !locals.accessCodes.includes(menu?.value)) return redirect("/404");
      }
    }
  } 

  if (micromatch.isMatch(url.pathname, redirectRoutes)) {
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");
    if (accessToken && refreshToken) return redirect("/");
  }
  else if(!refreshToken?.value && !accessToken?.value){
    if(!micromatch.isMatch(url.pathname, publicRoutes)) return redirect("/404");
  }
  
  return next();
}
);
