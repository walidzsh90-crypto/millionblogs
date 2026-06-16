"use client";

const markerName = "mb_auth";

export function setSessionMarker() {
  document.cookie = `${markerName}=1; path=/; SameSite=Lax`;
}

export function clearSessionMarker() {
  document.cookie = `${markerName}=; path=/; max-age=0; SameSite=Lax`;
}
