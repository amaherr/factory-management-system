import { useMemo } from 'react';

export interface StockDistributionEntry {
  location: string;
  section?: string;
  quantityInStock: number;
}

interface DistributionLabels {
  totalUnits: string;
  locations: string;
  sections: string;
  location: string;
  locationTotal: string;
  units: string;
}

interface StockDistributionSummaryProps {
  locations: StockDistributionEntry[];
  getLocationLabel?: (locationName: string) => string;
  emptyMessage?: string;
  labels?: Partial<DistributionLabels>;
}

const DEFAULT_LABELS: DistributionLabels = {
  totalUnits: 'Total Units',
  locations: 'Locations',
  sections: 'Sections',
  location: 'Location',
  locationTotal: 'Location Total',
  units: 'units',
};

export function StockDistributionSummary({
  locations,
  getLocationLabel,
  emptyMessage = 'No stock available for this product.',
  labels,
}: StockDistributionSummaryProps) {
  const resolvedLabels: DistributionLabels = {
    ...DEFAULT_LABELS,
    ...(labels || {}),
  };

  const distribution = useMemo(() => {
    const entries = (locations || [])
      .map((entry) => ({
        location: entry.location,
        section: entry.section?.trim() || 'UNSPECIFIED',
        quantity: Number(entry.quantityInStock || 0),
      }))
      .filter((entry) => entry.quantity > 0);

    const totalStock = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    const locationMap = new Map<
      string,
      {
        location: string;
        total: number;
        sections: Array<{ section: string; quantity: number }>;
      }
    >();

    for (const entry of entries) {
      const existing = locationMap.get(entry.location);
      if (!existing) {
        locationMap.set(entry.location, {
          location: entry.location,
          total: entry.quantity,
          sections: [{ section: entry.section, quantity: entry.quantity }],
        });
      } else {
        existing.total += entry.quantity;
        existing.sections.push({ section: entry.section, quantity: entry.quantity });
      }
    }

    const groupedLocations = Array.from(locationMap.values())
      .map((group) => ({
        ...group,
        sections: group.sections.sort((a, b) => b.quantity - a.quantity),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalStock,
      locations: groupedLocations,
      sectionsCount: entries.length,
    };
  }, [locations]);

  const resolveLocationLabel = (locationName: string) => {
    if (getLocationLabel) {
      return getLocationLabel(locationName);
    }
    return locationName;
  };

  if (distribution.totalStock === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-[--bg-secondary] px-3 py-2">
          <p className="text-xs text-muted-foreground">{resolvedLabels.totalUnits}</p>
          <p className="text-lg font-semibold">{distribution.totalStock}</p>
        </div>
        <div className="rounded-md border bg-[--bg-secondary] px-3 py-2">
          <p className="text-xs text-muted-foreground">{resolvedLabels.locations}</p>
          <p className="text-lg font-semibold">{distribution.locations.length}</p>
        </div>
        <div className="rounded-md border bg-[--bg-secondary] px-3 py-2">
          <p className="text-xs text-muted-foreground">{resolvedLabels.sections}</p>
          <p className="text-lg font-semibold">{distribution.sectionsCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        {distribution.locations.map((locationGroup) => {
          const locationShare =
            distribution.totalStock > 0 ? (locationGroup.total / distribution.totalStock) * 100 : 0;

          return (
            <div
              key={locationGroup.location}
              className="rounded-md border bg-[--bg-secondary] p-3"
            >
              <div className="mb-3 grid grid-cols-[1fr_auto] items-start gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {resolvedLabels.location}
                  </p>
                  <p className="text-base font-semibold leading-none mt-1">
                    {resolveLocationLabel(locationGroup.location)}
                  </p>
                </div>
                <div className="text-right rounded-md border bg-white/60 px-3 py-2 min-w-[110px]">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {resolvedLabels.locationTotal}
                  </p>
                  <p className="text-2xl font-bold leading-none text-[#1f4f86] mt-1">
                    {locationGroup.total}
                  </p>
                </div>
              </div>

              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[--border-subtle]">
                <div
                  className="h-full rounded-full bg-[#1f4f86]"
                  style={{ width: `${Math.max(locationShare, 2)}%` }}
                />
              </div>

              <div className="space-y-2">
                {locationGroup.sections.map((sectionEntry) => {
                  const sectionShare =
                    locationGroup.total > 0
                      ? (sectionEntry.quantity / locationGroup.total) * 100
                      : 0;

                  return (
                    <div
                      key={`${locationGroup.location}-${sectionEntry.section}`}
                      className="rounded-md border bg-white/40 px-2.5 py-2"
                    >
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{sectionEntry.section}</span>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {sectionEntry.quantity} {resolvedLabels.units}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[--border-subtle]">
                        <div
                          className="h-full rounded-full bg-[#a9c2dc]"
                          style={{ width: `${Math.max(sectionShare, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
