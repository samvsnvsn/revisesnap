export const runtime = 'nodejs';
export async function POST(req: Request) {
  const form = await req.formData();
  const lang = (form.get('lang') as string) || 'en';
  const segments = [
    { text: 'Photosynthesis converts light energy into chemical energy.', start: 0, end: 4 },
    { text: 'Chlorophyll absorbs mainly blue and red wavelengths.', start: 4, end: 9 },
    { text: 'Glucose and oxygen are produced in chloroplasts.', start: 9, end: 14 }
  ];
  return Response.json({ language: lang, segments });
}
