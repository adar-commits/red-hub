-- FAQ page content (admin-managed): settings singleton + sections + items

CREATE TABLE IF NOT EXISTS public.faq_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  page_title TEXT NOT NULL,
  page_subtitle TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL DEFAULT '',
  video_iframe_title TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT faq_settings_singleton CHECK (id = 'default')
);

CREATE TABLE IF NOT EXISTS public.faq_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heading TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_sections_sort ON public.faq_sections (sort_order);

CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.faq_sections (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_items_section_sort ON public.faq_items (section_id, sort_order);

ALTER TABLE public.faq_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Server uses service_role (bypasses RLS). Optional authenticated admin policies mirror announcements.
CREATE POLICY "authenticated_full_faq_settings" ON public.faq_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_faq_sections" ON public.faq_sections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_faq_items" ON public.faq_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed defaults (matches legacy src/data/faq-content.ts)
INSERT INTO public.faq_settings (id, page_title, page_subtitle, youtube_video_id, video_iframe_title)
VALUES (
  'default',
  'שאלות נפוצות',
  'סרטון הדרכה ושאלות נפוצות לשימוש בפורטל',
  'JwEtvwQbnC8',
  'סרטון הדרכה — פורטל אדריכלים ומעצבים'
)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  sid UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.faq_sections LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO public.faq_sections (heading, sort_order) VALUES ('כללי', 0) RETURNING id INTO sid;
  INSERT INTO public.faq_items (section_id, title, body, sort_order) VALUES
    (sid, 'מהו הפורטל וכיצד ניתן להשתמש בו?', 'הפורטל הוא פלטפורמה דיגיטלית לניהול תקשורת בין מעצבים לחברת השטיח האדום, הכוללת אפשרויות לניהול עמלות, צפייה בנתונים ועדכון פרטי חברה.', 0),
    (sid, 'איך ניתן לפנות למחלקת אדריכלים/מעצבים?', 'לחצו על אייקון "יש לך שאלה?" בפינה השמאלית התחתונה של המסך, מלאו את הטופס ובחרו את נושא הפנייה. אנו נחזור אליכם בהקדם :)', 1),
    (sid, 'מהו תהליך קבלת העמלה בפורטל?', 'הוספת שיוך לעסקה - אם לא שוייכתם לעסקה בתור המעצב/ת, לא תראו אותה במסך "העסקאות שלי". בשביל לשייך את העסקה אליכם, לחצו על כפתור "הוספת עסקה חדשה" ומלאו את הפרטים הנדרשים בטופס. שימו לב! ניתן לבצע שיוך רק לאחר אספקת ההזמנה ללקוח או לאחר איסוף עצמי/אספקה מאולם תצוגה (לא בוצעה אספקה) ניתן לשייך לאחר מכן. שינוי בהזמנה - ממועד קבלת המוצר/ים יש ברשות הלקוח 14 יום לבצע החלפה/ביטול למוצר/ים בהזמנה, ולכן אם הוספתם את עצמכם בתור מעצב/ת לעסקה בטווח זמן זה, טרם תוכלו לבקש תשלום וסטטוס העסקה יהיה "ממתין לאישור". צבירת עמלות - בחלוף 14 יום העסקה תשוייך לתעודת עמלה באופן אוטומטי, תוכלו לצפות בה במסך "תעודות עמלה". כל תעודת עמלה חודשית מאגדת את העמלות מאותו החודש. בקשה לתשלום - אם צברתם לפחות 500 ש"ח בעמלות (גם בצבירה של יותר מתעודת עמלה אחת), סטטוס תעודת העמלה הרלוונטית תשנה ל"חשבונית חסרה" . כל שנותר לכם הוא לעלות חשבונית עבור תשלום העמלה במסך "תעודות עמלה" (יש לוודא כי פרטי החשבון מעודכנים בעמוד פרטים אישיים) . ביצוע תשלום - ביצוע התשלום בפועל יבוצע עד לסוף החודש הקלנדרי בו הוגשה החשבונית :)', 2);

  INSERT INTO public.faq_sections (heading, sort_order) VALUES ('מסך הבית', 1) RETURNING id INTO sid;
  INSERT INTO public.faq_items (section_id, title, body, sort_order) VALUES
    (sid, 'על איזו תקופת זמן מדובר בנתונים הכספיים?', 'הנתונים הכספיים הינם לשנתיים אחורה (כרגע מופיע מהשיוך הראשון)', 0),
    (sid, 'מה משמעות עסקאות ש"סופקו לאחרונה"?', 'חמשת העסקאות האחרונות ששויכו אליכם בתור מעצב/ת. שימו לב! לא בהכרח שולמה עמלה', 1),
    (sid, 'מה עליי לעשות אם אני לא רואה עסקה חדשה שביצעתי עם לקוחותיי בסניף או באתר?', 'יש לכך מס'' סיבות אפשריות: זמני אספקה: העסקה תשוקף בפורטל רק לאחר אספקת ההזמנה ללקוח או לאחר איסוף עצמי/אספקה מאולם תצוגה. נסו שנית לאחר 5 ימים (ככל הנראה טרם הופקה חשבונית עסקה). שימו לב! אם ההזמנה שביצעתם עם לקוחותיכם הינה הזמנה מוקדמת או הזמנת אחסנה, היא תשוקף בפורטל רק לאחר ההאספקה. השיוך לא בוצע במעמד ביצוע העסקה: אולמות תצוגה - עליכם ליידע את נציג המכירות, על מנת לשייך את העסקה באולמות התצוגה. אתר אינטרנט - במעמד ביצוע הזמנה באתר, יש להזין את קוד הסוכן שלכם בשדה ''קוד קופון''. עבור כל סיבה אחרת יש ליצור קשר עם מחלקת אדריכלים דרך סימן השאלה ואנו נשייך עבורכם.', 2);

  INSERT INTO public.faq_sections (heading, sort_order) VALUES ('העסקאות שלי', 2) RETURNING id INTO sid;
  INSERT INTO public.faq_items (section_id, title, body, sort_order) VALUES
    (sid, 'איך ניתן לראות את רשימת העסקאות שלי?', 'ניתן לצפות ברשימת העסקאות שלכם באמצעות מסך "העסקאות שלי". ברשימה יש נתונים על תאריך החשבונית, שם לקוח, טלפון, סכום עסקה לפני מע"מ, סטטוס.', 0),
    (sid, 'כיצד ניתן לשייך עסקה חדשה?', 'ניתן לשייך עסקה חדשה דרך מסך "העסקאות שלי". לחצו על הכפתור "הוספת עסקה חדשה" ומלאו את הפרטים הנדרשים בטופס. שימו לב! ניתן לבצע שיוך רק במידה והמוצר סופק ללקוח. יש להזין את מספר או מספרי הטלפון שהוזנו במעמד ביצוע העסקה.', 1),
    (sid, 'מה עליי לעשות אם המערכת לא איתרה את הנתונים שהזנתי?', 'יש לכך מס'' סיבות אפשריות: הנתונים שהוזנו שגויים - נסו להזין נייד נוסף (במידה וישנו). נסו שנית לאחר 5 ימים (ככל הנראה טרם הופקה חשבונית עסקה). הזמנה באחסנה / הזמנה מוקדמת - יש ליצור קשר עם מחלקת אדריכלים דרך סימן השאלה ואנו נשייך עבורכם במידה ולא בוצע שיוך.', 2);

  INSERT INTO public.faq_sections (heading, sort_order) VALUES ('תעודות עמלה', 3) RETURNING id INTO sid;
  INSERT INTO public.faq_items (section_id, title, body, sort_order) VALUES
    (sid, 'כיצד ניתן לצפות בעמלות שלי?', 'עברו למסך "תעודות עמלה" כדי לראות רשימה מלאה של העמלות, כולל סטטוס, תאריך וסכום.', 0);

  INSERT INTO public.faq_sections (heading, sort_order) VALUES ('פרטי עסק', 4) RETURNING id INTO sid;
  INSERT INTO public.faq_items (section_id, title, body, sort_order) VALUES
    (sid, 'איפה ניתן לעדכן פרטים אישיים?', 'ניתן לעדכן פרטים אישיים דרך מסך "פרטי החברה". ערכו את הפרטים הרלוונטים ולחצו "שמור".', 0);
END $$;

-- Atomic replace for admin saves (called from API via RPC)
CREATE OR REPLACE FUNCTION public.replace_faq_content(
  p_page_title TEXT,
  p_page_subtitle TEXT,
  p_youtube_video_id TEXT,
  p_video_iframe_title TEXT,
  p_sections JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sec JSONB;
  idx INT := 0;
  jdx INT;
  it JSONB;
  new_sid UUID;
BEGIN
  INSERT INTO public.faq_settings (id, page_title, page_subtitle, youtube_video_id, video_iframe_title, updated_at)
  VALUES (
    'default',
    p_page_title,
    p_page_subtitle,
    COALESCE(p_youtube_video_id, ''),
    COALESCE(p_video_iframe_title, ''),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    page_title = EXCLUDED.page_title,
    page_subtitle = EXCLUDED.page_subtitle,
    youtube_video_id = EXCLUDED.youtube_video_id,
    video_iframe_title = EXCLUDED.video_iframe_title,
    updated_at = now();

  -- Supabase rejects unqualified DELETE; WHERE true preserves same semantics (delete all rows).
  DELETE FROM public.faq_sections WHERE true;

  IF p_sections IS NULL OR jsonb_typeof(p_sections) != 'array' THEN
    RETURN;
  END IF;

  FOR sec IN SELECT * FROM jsonb_array_elements(p_sections)
  LOOP
    INSERT INTO public.faq_sections (heading, sort_order)
    VALUES (COALESCE(sec->>'heading', ''), idx)
    RETURNING id INTO new_sid;

    jdx := 0;
    IF sec->'items' IS NOT NULL AND jsonb_typeof(sec->'items') = 'array' THEN
      FOR it IN SELECT * FROM jsonb_array_elements(sec->'items')
      LOOP
        INSERT INTO public.faq_items (section_id, title, body, sort_order)
        VALUES (
          new_sid,
          COALESCE(it->>'title', ''),
          COALESCE(it->>'body', ''),
          jdx
        );
        jdx := jdx + 1;
      END LOOP;
    END IF;

    idx := idx + 1;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_faq_content(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_faq_content(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
