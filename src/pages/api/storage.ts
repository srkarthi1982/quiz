import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { fileObjectToBuffer } from "../../common/utils";
import sharp from "sharp";
export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  let table = formData.get("table")?.toString() || "";
  let file: any = formData.get("file");
  let path: string = "";
  if (file) {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.split('.')[0]}.webp`;
    const fileBuffer = await fileObjectToBuffer(file);
    const processedImageBuffer = await sharp(fileBuffer).resize(200, 200).webp().toBuffer();
    const { data, error } = await supabase.storage.from("images").upload(`${table}/${fileName}`, processedImageBuffer, { upsert: true });
    if (error) console.log('error', error)
    path = data?.path.replace(`${table}/`, "") || "";
  }
  return new Response(path, { status: 200 });
};
