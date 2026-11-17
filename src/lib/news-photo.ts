/** Team photos have the heads in the upper part of the frame. Cropping around the vertical centre (the
 *  `object-cover` default) cuts the heads off on wide screens, so the crop is anchored near the top (15%).
 *  The class is a full literal so Tailwind picks it up. */
export const NEWS_PHOTO_POSITION_CLASS = "object-[50%_15%]";
