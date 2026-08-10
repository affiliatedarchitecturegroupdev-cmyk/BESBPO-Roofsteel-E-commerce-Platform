import json
from screens_mobile import icon, R_LOGO, CATEGORIES, PRODUCTS

def desktop_home():
    cat_html = "".join(f'''
      <div class="cat-tile cat-tile--desktop">
        <div class="cat-tile-icon">{icon(c[0], 24, "#E8631C")}</div>
        <div class="cat-tile-name">{c[1]}</div>
        <div class="cat-tile-count">{c[2]} LINES</div>
      </div>''' for c in CATEGORIES)

    prod_html = "".join(f'''
      <div class="pcard pcard--desktop">
        <div class="pcard-img"></div>
        <span class="fulfilment-badge {'fulfilment-badge--stock' if p[3]=='STOCK' else ''}">{p[3]}</span>
        <div class="pcard-name">{p[0]}</div>
        <div class="pcard-price">{p[1]} <span class="pcard-unit">{p[2]}</span></div>
      </div>''' for p in PRODUCTS)

    nav_items = "Steel Roofing", "Structural", "Reinforcing", "Timber", "Tiles", "Accessories"
    nav_html = "".join(f'<span class="dnav-link">{n}</span>' for n in nav_items)

    return f'''
    <div class="frame frame-desktop">
      <div class="store-header store-header--desktop">
        <div class="brand">{R_LOGO}<span class="brand-word">ROOFSTEEL</span></div>
        <nav class="dnav">{nav_html}</nav>
        <div class="dsearch">{icon("compass", 16, "#7C8892")}<span>Search products...</span></div>
        <div class="header-icons">
          {icon("users", 20, "#1A1F24")}
          <div class="cart-icon-wrap">{icon("bag", 20, "#1A1F24")}<span class="cart-badge">2</span></div>
        </div>
      </div>

      <div class="promo-strip promo-strip--desktop">
        <div>
          <div class="promo-eyebrow">STEEL ROOFING SHEETS</div>
          <div class="promo-headline promo-headline--desktop">Rolled to your exact length</div>
          <div class="promo-sub">Every gauge, every profile, cut to spec.</div>
          <a class="btn btn-primary">Shop Now</a>
        </div>
        <div class="promo-dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>
      </div>

      <div class="section">
        <div class="section-head"><h3>Shop by Category</h3><a class="see-all">See all 13</a></div>
        <div class="cat-grid-desktop">{cat_html}</div>
      </div>

      <div class="section mtl-banner mtl-banner--desktop">
        <div>
          <div class="mtl-banner-eyebrow">{icon("scissors", 14, "#E8631C")} THE DIFFERENTIATOR</div>
          <div class="mtl-banner-title">Made to Length</div>
          <div class="mtl-banner-sub">Roll-formed to your exact spec, not off the shelf — 0.30-0.80mm gauge, up to 13.2m.</div>
        </div>
        <a class="btn btn-outline-dark">See how it works</a>
      </div>

      <div class="section">
        <div class="section-head"><h3>Trending Now</h3></div>
        <div class="pcard-grid-desktop">{prod_html}</div>
      </div>
    </div>'''

def desktop_pdp():
    return f'''
    <div class="frame frame-desktop">
      <div class="store-header store-header--desktop">
        <div class="brand">{R_LOGO}<span class="brand-word">ROOFSTEEL</span></div>
        <nav class="dnav">
          <span class="dnav-link">Steel Roofing</span><span class="dnav-link">Structural</span>
          <span class="dnav-link">Reinforcing</span><span class="dnav-link">Timber</span>
        </nav>
        <div class="dsearch">{icon("compass", 16, "#7C8892")}<span>Search products...</span></div>
        <div class="header-icons">
          {icon("users", 20, "#1A1F24")}
          <div class="cart-icon-wrap">{icon("bag", 20, "#1A1F24")}<span class="cart-badge">2</span></div>
        </div>
      </div>

      <div class="breadcrumb">Home / Steel Roofing Sheets / IBR 686 Roofing Sheet</div>

      <div class="pdp-desktop-grid">
        <div class="pdp-gallery pdp-gallery--desktop">
          <div class="pdp-gallery-dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>
        </div>

        <div class="pdp-desktop-right">
          <span class="fulfilment-badge">MADE TO LENGTH</span>
          <h2 class="pdp-title pdp-title--desktop">IBR 686 Roofing Sheet</h2>
          <div class="pdp-sku">SKU: RS-1000 &nbsp;&middot;&nbsp; 0.40-0.80mm gauge &middot; galvanised or colour-coated</div>
          <div class="pdp-price-row">
            <span class="pdp-price">R210.25</span><span class="pdp-price-unit">/ m²</span>
            <span class="tier-badge tier-badge--trade">TRADE PRICE APPLIED</span>
          </div>

          <div class="configurator configurator--desktop">
            <div class="configurator-title">{icon("scissors", 16, "#E8631C")} Configure Your Sheet</div>
            <div class="config-grid-desktop">
              <div>
                <label class="config-label">Gauge</label>
                <div class="pill-row">
                  <span class="pill">0.40mm</span><span class="pill active">0.53mm</span><span class="pill">0.58mm</span><span class="pill">0.80mm</span>
                </div>
                <label class="config-label">Profile</label>
                <div class="pill-row">
                  <span class="pill active">IBR</span><span class="pill">Corrugated</span><span class="pill">Concealed-Fix</span>
                </div>
              </div>
              <div>
                <label class="config-label">Colour</label>
                <div class="swatch-row">
                  <span class="swatch" style="background:#3A3F42"></span>
                  <span class="swatch active" style="background:#6E7072"></span>
                  <span class="swatch" style="background:#4A5A3C"></span>
                  <span class="swatch" style="background:#8C2F26"></span>
                </div>
                <label class="config-label">Length <span class="config-hint">Max 13.2m</span></label>
                <div class="length-input-row">
                  <input class="length-input" value="6.2" /> <span class="length-unit">m</span>
                </div>
              </div>
            </div>
            <div class="config-live-price">
              <span>6.2m &times; R210.25/m²</span>
              <span class="config-live-total">R1,303.55</span>
            </div>
          </div>

          <a class="btn btn-primary btn-full">Add to Cart — R1,303.55</a>

          <div class="section" style="margin-top:24px;">
            <div class="accordion-row"><span>Specifications</span>{icon("chevronDown", 16)}</div>
            <div class="accordion-row"><span>Compliance &amp; Certificates</span>{icon("chevronDown", 16)}</div>
          </div>
        </div>
      </div>
    </div>'''
