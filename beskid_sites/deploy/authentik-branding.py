"""Idempotent production branding for the Beskid Authentik tenant.

Run inside `ak shell` after Compose brings Authentik up.  Keep this small and
model-driven: the deployment must recreate the same login experience without
clicking through the admin UI.
"""

from django.apps import apps


Application = apps.get_model("authentik_core", "Application")
Brand = apps.get_model("authentik_brands", "Brand")

AUTH_URL = "https://auth.beskid-lang.org"
LOGO_URL = (
    "https://raw.githubusercontent.com/Cyber-Nomad-Collective/beskid/main/"
    "site/website/src/assets/beskid_logo.svg"
)
# Beskid Żywiecki from Mała Racza, by Pudelek, CC BY 3.0:
# https://commons.wikimedia.org/wiki/File:Beskid_%C5%BBywiecki._Widok_z_Ma%C5%82ej_Raczy.jpg
BACKGROUND_URL = (
    "https://commons.wikimedia.org/wiki/Special:FilePath/"
    "Beskid%20%C5%BBywiecki.%20Widok%20z%20Ma%C5%82ej%20Raczy.jpg?width=1920"
)

# The Learn client begins login at its protected origin.  This short slug is
# retained as a safe compatibility target for existing bookmarks during the
# rollout.
learn = Application.objects.filter(name="Beskid learn.beskid-lang.org").first()
if learn is not None and learn.slug != "learn":
    learn.slug = "learn"
    learn.save(update_fields=["slug"])

brand = Brand.objects.get(default=True)
brand.branding_title = "Beskid"
brand.branding_logo = LOGO_URL
brand.branding_default_flow_background = BACKGROUND_URL
brand.branding_custom_css = """
:root {
  --pf-v5-global--primary-color--100: #73d0ff;
  --pf-v5-global--link--Color: #73d0ff;
  --pf-v5-global--BackgroundColor--100: #0b1015;
  --pf-v5-global--Color--100: #e9f2f7;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
}

body { background-color: #081019; color: #e9f2f7; }

.pf-c-login__main {
  background: rgba(11, 16, 21, 0.94);
  border: 1px solid rgba(115, 208, 255, 0.35);
  border-radius: 1rem;
  box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.48);
}

.pf-c-login__main-header {
  border-bottom: 1px solid rgba(115, 208, 255, 0.16);
  padding-bottom: 1.25rem;
}

.pf-c-brand img { width: min(12rem, 48vw); max-height: 5.5rem; object-fit: contain; }

.pf-c-button.pf-m-primary {
  background: #73d0ff;
  border-color: #73d0ff;
  color: #07131b;
  font-family: inherit;
  font-weight: 650;
}

.pf-c-login__footer {
  margin-top: 0.75rem;
  opacity: 0.55;
  transform: scale(0.78);
  transform-origin: center top;
}

.pf-c-login__footer::after {
  content: "Photo: Pudelek · CC BY 3.0";
  display: block;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  margin-top: 0.35rem;
}
"""
brand.save()

print(f"Configured Beskid Authentik brand at {AUTH_URL}.")
