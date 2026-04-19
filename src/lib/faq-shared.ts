/** FAQ document shape for DB, API, designer page, and admin editor. */

export type FaqSettingsPayload = {
  page_title: string;
  page_subtitle: string;
  youtube_video_id: string;
  video_iframe_title: string;
};

export type FaqItemPayload = {
  title: string;
  body: string;
};

export type FaqSectionPayload = {
  heading: string;
  items: FaqItemPayload[];
};

export type FaqDocumentPayload = {
  settings: FaqSettingsPayload;
  sections: FaqSectionPayload[];
};
