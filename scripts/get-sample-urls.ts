import { config } from 'dotenv'; config({ path: '.env.local' }); config({ path: '.env' });
import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main(){
  const { data } = await s.from('products').select('sku, slug, name, images, categories(slug, name)').eq('status','active').not('description','is',null).not('images','eq','[]').not('category_id','is',null).order('sku').limit(6);
  for (const p of data ?? []) {
    const cat = (p.categories as any)?.slug ?? 'kranea';
    console.log('http://localhost:3000/' + cat + '/' + p.slug);
    console.log('  → ' + p.name);
    console.log('  category: ' + ((p.categories as any)?.name ?? '(none)'));
    console.log('  images: ' + (Array.isArray(p.images) ? p.images.length : 0));
    console.log('');
  }
}
main().catch(console.error);
