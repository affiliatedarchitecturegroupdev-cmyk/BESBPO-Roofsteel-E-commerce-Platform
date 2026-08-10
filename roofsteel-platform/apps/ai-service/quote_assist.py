"""
Quote assist — generates plain-language cut-list summaries for Made-to-Length
steel roofing configurations. Used in order confirmation emails and PDFs.

This is structured text generation, not an LLM call — at this catalogue size
(171 product lines, ~10 profiles, ~5 gauges), a deterministic template produces
accurate, consistent output without the latency or cost of an API call.
"""


def generate_cut_list_summary(config) -> str:
    """Generate a human-readable cut-list summary from a Made-to-Length config.

    Args:
        config: MtLConfig with gauge, profile, length_mm, quantity, colour.

    Returns:
        A multi-line summary string suitable for email/PDF inclusion.
    """
    length_m = config.length_mm / 1000
    total_length_m = length_m * config.quantity
    total_area_m2 = round(total_length_m * 0.762, 2)  # standard sheet width ~762mm

    lines = [
        f"Cut List Summary",
        f"{'─' * 40}",
        f"Profile:      {config.profile}",
        f"Gauge:        {config.gauge}",
        f"Length:       {config.length_mm}mm ({length_m:.2f}m per sheet)",
        f"Quantity:     {config.quantity} sheet(s)",
    ]

    if config.colour:
        lines.append(f"Colour:       {config.colour}")

    lines.extend([
        f"{'─' * 40}",
        f"Total length: {total_length_m:.2f}m",
        f"Est. area:    {total_area_m2}m² (based on 762mm cover width)",
        f"{'─' * 40}",
        f"All sheets cut to exact specification. Verify gauge and profile",
        f"before installation. Colour-matched flashings recommended.",
    ])

    return "\n".join(lines)
