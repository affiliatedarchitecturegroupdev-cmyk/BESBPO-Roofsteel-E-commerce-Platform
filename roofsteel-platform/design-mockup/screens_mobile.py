import json

icons = json.load(open("icons/all_icons.json"))

def icon(name, size=20, color="currentColor", cls=""):
    svg = icons.get(name, icons["grid"])
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{svg}</svg>'

R_LOGO = '''<svg viewBox="0 0 100 100" width="26" height="26">
<path fill-rule="evenodd" fill="#E8631C" d="M20,15 L80,15 L80,48 L54,48 L88,85 L72,85 L40,48 L36,48 L36,85 L20,85 Z M44,23 L68,23 L68,40 L44,40 Z"/>
<path fill="#B84A12" d="M54,48 L88,85 L78,85 L48,52 Z"/>
<g stroke="#F2F1ED" stroke-width="2.4"><line x1="20" y1="58" x2="36" y2="58"/><line x1="20" y1="65" x2="36" y2="65"/><line x1="20" y1="72" x2="36" y2="72"/></g>
</svg>'''

CATEGORIES = [
    ("layers", "Steel Roofing Sheets", "10"),
    ("beam", "Structural Steel", "63"),
    ("hash", "Reinforcing Steel", "17"),
    ("tree", "Roofing Timber", "13"),
    ("grid", "Roof Tiles", "9"),
    ("tool", "Accessories", "25"),
]

PRODUCTS = [
    ("IBR 686 Roofing Sheet", "R210.25", "per m²", "MADE TO LENGTH"),
    ("Reinforcing Bar Y12", "R26.75", "per m", "MADE TO LENGTH"),
    ("Hard Hats", "R67.20", "each", "STOCK"),
    ("Concrete Roof Tile", "R12.83", "per tile", "STOCK"),
]

def mobile_home():
    cat_html = "".join(f'''
      <div class="cat-tile">
        <div class="cat-tile-icon">{icon(c[0], 22, "#E8631C")}</div>
        <div class="cat-tile-name">{c[1]}</div>
        <div class="cat-tile-count">{c[2]} LINES</div>
      </div>''' for c in CATEGORIES[:4])

    prod_html = "".join(f'''
      <div class="pcard">
        <div class="pcard-img"></div>
        <span class="fulfilment-badge {'fulfilment-badge--stock' if p[3]=='STOCK' else ''}">{p[3]}</span>
        <div class="pcard-name">{p[0]}</div>
        <div class="pcard-price">{p[1]} <span class="pcard-unit">{p[2]}</span></div>
      </div>''' for p in PRODUCTS)

    return f'''
    <div class="frame frame-mobile">
      <div class="store-header">
        <div class="brand">{R_LOGO}<span class="brand-word">ROOFSTEEL</span></div>
        <div class="header-icons">
          {icon("compass", 20, "#1A1F24")}
          <div class="cart-icon-wrap">{icon("bag", 20, "#1A1F24")}<span class="cart-badge">2</span></div>
        </div>
      </div>

      <div class="promo-strip">
        <div class="promo-eyebrow">STEEL ROOFING SHEETS</div>
        <div class="promo-headline">Rolled to your exact length</div>
        <a class="btn btn-primary btn-sm">Shop Now</a>
        <div class="promo-dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>
      </div>

      <div class="section">
        <div class="section-head"><h3>Shop by Category</h3><a class="see-all">See all 13</a></div>
        <div class="cat-grid-mobile">{cat_html}</div>
      </div>

      <div class="section mtl-banner">
        <div class="mtl-banner-eyebrow">{icon("scissors", 14, "#E8631C")} THE DIFFERENTIATOR</div>
        <div class="mtl-banner-title">Made to Length</div>
        <div class="mtl-banner-sub">Roll-formed to your exact spec — not off the shelf.</div>
        <a class="btn btn-outline-dark btn-sm">See how it works</a>
      </div>

      <div class="section">
        <div class="section-head"><h3>Trending Now</h3></div>
        <div class="pcard-scroll">{prod_html}</div>
      </div>

      <div class="tab-bar">
        <div class="tab-item active">{icon("home", 20)}<span>Home</span></div>
        <div class="tab-item">{icon("grid", 20)}<span>Categories</span></div>
        <div class="tab-item">{icon("compass", 20)}<span>Search</span></div>
        <div class="tab-item">{icon("bag", 20)}<span>Cart</span><span class="tab-badge">2</span></div>
        <div class="tab-item">{icon("users", 20)}<span>Account</span></div>
      </div>
    </div>'''

def mobile_pdp():
    return f'''
    <div class="frame frame-mobile">
      <div class="store-header store-header--pdp">
        {icon("arrowLeft", 20, "#1A1F24")}
        <span class="pdp-header-title">IBR 686 Roofing Sheet</span>
        <div class="cart-icon-wrap">{icon("bag", 20, "#1A1F24")}<span class="cart-badge">2</span></div>
      </div>

      <div class="pdp-gallery"><div class="pdp-gallery-dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div></div>

      <div class="pdp-info">
        <span class="fulfilment-badge">MADE TO LENGTH</span>
        <h2 class="pdp-title">IBR 686 Roofing Sheet</h2>
        <div class="pdp-sku">SKU: RS-1000 &nbsp;&middot;&nbsp; 0.40-0.80mm gauge &middot; galvanised or colour-coated</div>
        <div class="pdp-price-row">
          <span class="pdp-price">R210.25</span><span class="pdp-price-unit">/ m²</span>
        </div>
      </div>

      <div class="configurator">
        <div class="configurator-title">{icon("scissors", 16, "#E8631C")} Configure Your Sheet</div>

        <label class="config-label">Gauge</label>
        <div class="pill-row">
          <span class="pill">0.40mm</span><span class="pill active">0.53mm</span><span class="pill">0.58mm</span><span class="pill">0.80mm</span>
        </div>

        <label class="config-label">Profile</label>
        <div class="pill-row">
          <span class="pill active">IBR</span><span class="pill">Corrugated</span><span class="pill">Concealed-Fix</span>
        </div>

        <label class="config-label">Colour</label>
        <div class="swatch-row">
          <span class="swatch" style="background:#3A3F42" title="Charcoal"></span>
          <span class="swatch active" style="background:#6E7072" title="Galvanised"></span>
          <span class="swatch" style="background:#4A5A3C" title="Chromadec Green"></span>
          <span class="swatch" style="background:#8C2F26" title="Rustic Red"></span>
        </div>

        <label class="config-label">Length <span class="config-hint">Max 13.2m</span></label>
        <div class="length-input-row">
          <input class="length-input" value="6.2" /> <span class="length-unit">m</span>
        </div>

        <div class="config-live-price">
          <span>6.2m &times; R210.25/m²</span>
          <span class="config-live-total">R1,303.55</span>
        </div>
      </div>

      <div class="section">
        <div class="accordion-row"><span>Specifications</span>{icon("chevronDown", 16)}</div>
        <div class="accordion-row"><span>Compliance &amp; Certificates</span>{icon("chevronDown", 16)}</div>
        <div class="accordion-row"><span>Delivery &amp; Returns</span>{icon("chevronDown", 16)}</div>
      </div>

      <div class="pdp-sticky-cta">
        <div class="pdp-sticky-price"><span class="pdp-sticky-total">R1,303.55</span><span class="pdp-sticky-sub">6.2m configured</span></div>
        <a class="btn btn-primary">Add to Cart</a>
      </div>
    </div>'''

def mobile_cart():
    return f'''
    <div class="frame frame-mobile">
      <div class="cart-drawer-header">
        <span>Your Cart (2)</span>{icon("close", 22, "#1A1F24")}
      </div>
      <div class="free-delivery-bar">
        <div class="free-delivery-track"><div class="free-delivery-fill" style="width:62%"></div></div>
        <div class="free-delivery-label">Add R5,696.45 more for free delivery</div>
      </div>

      <div class="cart-line">
        <div class="cart-line-img"></div>
        <div class="cart-line-info">
          <div class="cart-line-name">IBR 686 Roofing Sheet</div>
          <div class="cart-line-config">0.53mm &middot; IBR &middot; Galvanised &middot; 6.2m</div>
          <div class="cart-line-qty-row">
            <div class="qty-stepper"><span>-</span><span class="qty-val">1</span><span>+</span></div>
            <span class="cart-line-price">R1,303.55</span>
          </div>
        </div>
      </div>

      <div class="cart-line">
        <div class="cart-line-img"></div>
        <div class="cart-line-info">
          <div class="cart-line-name">Roof Screws — Class 3/4</div>
          <div class="cart-line-config">Box of 250</div>
          <div class="cart-line-qty-row">
            <div class="qty-stepper"><span>-</span><span class="qty-val">2</span><span>+</span></div>
            <span class="cart-line-price">R656.10</span>
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <div class="cart-summary-row"><span>Subtotal</span><span>R1,959.65</span></div>
        <div class="cart-summary-row"><span>Delivery</span><span>R450.00</span></div>
        <div class="cart-summary-row cart-summary-total"><span>Total</span><span>R2,409.65</span></div>
        <a class="btn btn-primary" style="width:100%;margin-top:12px;">Checkout</a>
      </div>
    </div>'''

print("screens module ready")
