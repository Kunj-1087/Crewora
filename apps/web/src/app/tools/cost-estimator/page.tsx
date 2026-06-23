'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  Zap, 
  Paintbrush, 
  Scissors, 
  Info, 
  Smartphone,
  ChevronRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { StyleSheet, theme } from '@/theme';

type Category = 'plumbing' | 'electrical' | 'carpentry' | 'painting';

interface ServiceItem {
  id: string;
  name: string;
  unit: string;
  baseLaborRate: number; // in INR
  stdMaterialAddon: number; // in INR
  premMaterialAddon: number; // in INR
  description: string;
}

const SERVICES_DATA: Record<Category, ServiceItem[]> = {
  plumbing: [
    { id: 'tap-replace', name: 'Tap / Faucet Replacement', unit: 'tap(s)', baseLaborRate: 200, stdMaterialAddon: 300, premMaterialAddon: 1200, description: 'Installation of a new sink/bathroom faucet. Material option includes Teflon tape & connector pipe.' },
    { id: 'flush-repair', name: 'Flush Tank Repair / Rebuild', unit: 'tank(s)', baseLaborRate: 400, stdMaterialAddon: 250, premMaterialAddon: 650, description: 'Fixing leaks, overflow issues, or replacing flush syphon valve and inlet assembly.' },
    { id: 'pipe-leak', name: 'Pipeline Leakage Repair', unit: 'joint(s)', baseLaborRate: 500, stdMaterialAddon: 200, premMaterialAddon: 500, description: 'Locating leak, cutting wall tiles (if required), and replacing damaged pipe section.' },
    { id: 'tank-clean', name: 'Water Tank Cleaning', unit: 'tank(s) (1000L)', baseLaborRate: 900, stdMaterialAddon: 0, premMaterialAddon: 0, description: 'High-pressure washing, mechanical scrub, and vacuuming of sediment from overhead tanks.' }
  ],
  electrical: [
    { id: 'switch-replace', name: 'Switch / Socket Replacement', unit: 'point(s)', baseLaborRate: 80, stdMaterialAddon: 80, premMaterialAddon: 250, description: 'Replacing standard 6A/16A switches or sockets on an existing modular board.' },
    { id: 'board-install', name: 'Modular Switchboard Installation', unit: 'board(s)', baseLaborRate: 350, stdMaterialAddon: 400, premMaterialAddon: 1200, description: 'Mounting new board, connecting internal modular wiring, and securing connection to junction box.' },
    { id: 'mcb-replace', name: 'MCB / DB Box Repair', unit: 'unit(s)', baseLaborRate: 250, stdMaterialAddon: 150, premMaterialAddon: 400, description: 'Replacing a tripping single-pole miniature circuit breaker (MCB) in the main distribution board.' },
    { id: 'house-rewiring', name: 'Full Room Rewiring', unit: 'room(s)', baseLaborRate: 3000, stdMaterialAddon: 2500, premMaterialAddon: 6000, description: 'Pulling new fire-retardant (FR) copper wires through conduits and installing modular boxes.' }
  ],
  carpentry: [
    { id: 'door-repair', name: 'Door Alignment & Lock Installation', unit: 'door(s)', baseLaborRate: 350, stdMaterialAddon: 450, premMaterialAddon: 1800, description: 'Fixing alignment, shaving jammed edges, or installing new cylindrical/deadbolt locks.' },
    { id: 'cabinet-hinge', name: 'Kitchen Cabinet Hinge Repair', unit: 'hinge(s)', baseLaborRate: 150, stdMaterialAddon: 100, premMaterialAddon: 350, description: 'Replacing broken cabinet hinges with standard auto-close or premium soft-close hydraulic hinges.' },
    { id: 'sofa-polish', name: 'Wood / Sofa Polishing', unit: 'seat(s)', baseLaborRate: 600, stdMaterialAddon: 300, premMaterialAddon: 800, description: 'Sanding old polish layer and applying protective NC lacquer or high-gloss polyurethane (PU) coat.' },
    { id: 'partition', name: 'Wooden Partition Wall', unit: 'sq. ft.', baseLaborRate: 120, stdMaterialAddon: 180, premMaterialAddon: 380, description: 'Erecting ply framing with laminate finishes. Putty prep and glass insertions are extra.' }
  ],
  painting: [
    { id: 'putty-prep', name: 'Wall Putty & Primer Preparation', unit: 'sq. ft.', baseLaborRate: 8, stdMaterialAddon: 6, premMaterialAddon: 12, description: 'Filling wall cracks, sanding surfaces, applying 2 coats of acrylic putty and 1 coat of primer.' },
    { id: 'distemper-paint', name: 'Interior Distemper Painting', unit: 'sq. ft.', baseLaborRate: 7, stdMaterialAddon: 5, premMaterialAddon: 8, description: 'Affordable water-based paint application. Best suited for ceilings and rental flats.' },
    { id: 'emulsion-paint', name: 'Standard Acrylic Emulsion', unit: 'sq. ft.', baseLaborRate: 12, stdMaterialAddon: 10, premMaterialAddon: 16, description: 'Washable, smooth matte finish paint. Resists dust and minor stains.' },
    { id: 'royal-paint', name: 'Premium Royal Emulsion', unit: 'sq. ft.', baseLaborRate: 18, stdMaterialAddon: 20, premMaterialAddon: 32, description: 'Luxury Teflon/silicon-based stain-resistant sheen coat. Anti-fungal properties.' }
  ]
};

export default function CostEstimator() {
  const [category, setCategory] = useState<Category>('plumbing');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [materialType, setMaterialType] = useState<'labor' | 'standard' | 'premium'>('labor');
  const [quantity, setQuantity] = useState<number>(1);

  // Set default service when category changes
  React.useEffect(() => {
    const defaultService = SERVICES_DATA[category][0];
    setSelectedServiceId(defaultService.id);
    if (category === 'painting') {
      setQuantity(500); // default paintable area in sq ft
    } else {
      setQuantity(1);
    }
  }, [category]);

  const selectedService = useMemo(() => {
    return SERVICES_DATA[category].find(s => s.id === selectedServiceId) || SERVICES_DATA[category][0];
  }, [category, selectedServiceId]);

  // Calculate pricing estimates
  const calculation = useMemo(() => {
    if (!selectedService) return { labor: 0, material: 0, total: 0, lowRange: 0, highRange: 0 };
    
    const labor = selectedService.baseLaborRate * quantity;
    let material = 0;
    
    if (materialType === 'standard') {
      material = selectedService.stdMaterialAddon * quantity;
    } else if (materialType === 'premium') {
      material = selectedService.premMaterialAddon * quantity;
    }

    const total = labor + material;
    
    // Provide a reasonable price range variance (±10%)
    const lowRange = Math.round(total * 0.9);
    const highRange = Math.round(total * 1.1);

    return {
      labor,
      material,
      total,
      lowRange,
      highRange
    };
  }, [selectedService, materialType, quantity]);

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      setQuantity(num);
    } else if (val === '') {
      setQuantity(1);
    }
  };

  const resetEstimator = () => {
    setCategory('plumbing');
    setMaterialType('labor');
    setQuantity(1);
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Header Banner */}
      <header style={styles.header}>
        <span style={styles.badge}> Ahmedabad Hyperlocal Tools </span>
        <h1 style={styles.title}>Home Service Cost Estimator</h1>
        <p style={styles.subtitle}>
          Get fair, transparent market price estimates for labor and materials in Ahmedabad. No hidden commissions.
        </p>
      </header>

      {/* Main Grid */}
      <div style={styles.container}>
        {/* Left Input Section */}
        <div style={styles.inputCard}>
          {/* Step 1: Category Selector */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>1. Select Service Category</label>
            <div style={styles.categoryGrid}>
              <button 
                onClick={() => setCategory('plumbing')}
                style={category === 'plumbing' ? styles.categoryBtnActive : styles.categoryBtn}
              >
                <Wrench size={18} style={category === 'plumbing' ? styles.iconActive : styles.icon} />
                Plumbing
              </button>
              <button 
                onClick={() => setCategory('electrical')}
                style={category === 'electrical' ? styles.categoryBtnActive : styles.categoryBtn}
              >
                <Zap size={18} style={category === 'electrical' ? styles.iconActive : styles.icon} />
                Electrical
              </button>
              <button 
                onClick={() => setCategory('carpentry')}
                style={category === 'carpentry' ? styles.categoryBtnActive : styles.categoryBtn}
              >
                <Scissors size={18} style={category === 'carpentry' ? styles.iconActive : styles.icon} />
                Carpentry
              </button>
              <button 
                onClick={() => setCategory('painting')}
                style={category === 'painting' ? styles.categoryBtnActive : styles.categoryBtn}
              >
                <Paintbrush size={18} style={category === 'painting' ? styles.iconActive : styles.icon} />
                Painting
              </button>
            </div>
          </div>

          {/* Step 2: Specific Service Selector */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>2. Select Specific Job</label>
            <select 
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              style={styles.selectInput}
            >
              {SERVICES_DATA[category].map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Base Labor: ₹{s.baseLaborRate}/{s.unit})
                </option>
              ))}
            </select>
            {selectedService && (
              <p style={styles.serviceDesc}>{selectedService.description}</p>
            )}
          </div>

          {/* Step 3: Material Quality Selector */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>3. Select Materials Option</label>
            <div style={styles.materialGrid}>
              <div 
                onClick={() => setMaterialType('labor')}
                style={materialType === 'labor' ? styles.materialCardActive : styles.materialCard}
              >
                <h4 style={styles.materialCardTitle}>Labor Only</h4>
                <p style={styles.materialCardText}>You buy the materials. Technicians execute the installation.</p>
              </div>

              {selectedService?.stdMaterialAddon > 0 && (
                <div 
                  onClick={() => setMaterialType('standard')}
                  style={materialType === 'standard' ? styles.materialCardActive : styles.materialCard}
                >
                  <h4 style={styles.materialCardTitle}>Standard Materials</h4>
                  <p style={styles.materialCardText}>Includes good quality standard local brands (Supreme, Finolex, Asian Paints Tractor).</p>
                </div>
              )}

              {selectedService?.premMaterialAddon > 0 && (
                <div 
                  onClick={() => setMaterialType('premium')}
                  style={materialType === 'premium' ? styles.materialCardActive : styles.materialCard}
                >
                  <h4 style={styles.materialCardTitle}>Premium Materials</h4>
                  <p style={styles.materialCardText}>Includes top-tier premium brands (Astral CPVC, Havells wires, Asian Paints Royal).</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Adjust Quantity / Area */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>
              4. Quantity / Area ({selectedService?.unit})
            </label>
            <div style={styles.quantityRow}>
              <input 
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                style={styles.quantityInput}
              />
              <input 
                type="range"
                min={category === 'painting' ? "100" : "1"}
                max={category === 'painting' ? "5000" : "50"}
                step={category === 'painting' ? "50" : "1"}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={styles.rangeSlider}
              />
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <h3 style={styles.summaryTitle}>Estimated Price Breakdown</h3>
            <button onClick={resetEstimator} style={styles.resetBtn}>
              <RefreshCw size={14} style={{ marginRight: 4 }} /> Reset
            </button>
          </div>

          <div style={styles.priceRangeBox}>
            <span style={styles.rangeLabel}>Ahmedabad Fair Price Range</span>
            <div style={styles.rangeValue}>
              ₹{calculation.lowRange.toLocaleString('en-IN')} - ₹{calculation.highRange.toLocaleString('en-IN')}
            </div>
            <p style={styles.taxInfo}>*Exclusive of local taxes, calculated for Ahmedabad area.</p>
          </div>

          <div style={styles.breakdownDetails}>
            <div style={styles.breakdownRow}>
              <span>Base Labor ({quantity} × ₹{selectedService?.baseLaborRate})</span>
              <span>₹{calculation.labor.toLocaleString('en-IN')}</span>
            </div>
            <div style={styles.breakdownRow}>
              <span>
                Material Cost (
                {materialType === 'labor' 
                  ? 'Self-purchased' 
                  : `${quantity} × ₹${materialType === 'standard' ? selectedService?.stdMaterialAddon : selectedService?.premMaterialAddon}`
                })
              </span>
              <span>₹{calculation.material.toLocaleString('en-IN')}</span>
            </div>
            <div style={styles.breakdownTotalRow}>
              <span>Median Estimate</span>
              <span>₹{calculation.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Localized Note */}
          <div style={styles.infoAlert}>
            <Info size={16} style={{ color: theme.colors.primaryDark, marginRight: 8, flexShrink: 0 }} />
            <p style={styles.infoAlertText}>
              Rates are derived from regular market index surveys in areas like Bopal, Satellite, Gota, and Vastrapur. Actual quotes depend on site accessibility and technicians\' inspections.
            </p>
          </div>

          {/* App CTA */}
          <div style={styles.downloadCta}>
            <div style={styles.downloadIconBox}>
              <Smartphone size={24} style={{ color: '#FFFFFF' }} />
            </div>
            <div>
              <h4 style={styles.downloadCtaTitle}>Hire Directly at Standard Rates</h4>
              <p style={styles.downloadCtaText}>
                Download Crewora to view physical shops, read verified local reviews, and book direct.
              </p>
              <Link href="/download-app" style={styles.downloadBtn}>
                Get Mobile App <ChevronRight size={14} style={{ marginLeft: 4 }} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <footer style={styles.faqSection}>
        <h3 style={styles.faqTitle}>Frequently Asked Questions</h3>
        <div style={styles.faqGrid}>
          <div style={styles.faqCard}>
            <h4 style={styles.faqQ}>Are these prices fixed on Crewora?</h4>
            <p style={styles.faqA}>
              No. These are recommended fair rates. On Crewora, you post your problem details, and verified local shop owners apply with their own custom rates. You negotiate and hire directly.
            </p>
          </div>
          <div style={styles.faqCard}>
            <h4 style={styles.faqQ}>Who buys the materials if I select "Labor Only"?</h4>
            <p style={styles.faqA}>
              You do. You can purchase the materials from local hardware markets in Kalupur or Bopal, or ask the technician to buy them and show the cash memo receipts at cost price.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    backgroundColor: theme.colors.surface,
    minHeight: '100vh',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    padding: `${theme.spacing[8]}px ${theme.spacing[4]}px`,
  },
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing[8],
    maxWidth: 800,
    margin: `0 auto ${theme.spacing[8]}px auto`,
  },
  badge: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    padding: '4px 12px',
    borderRadius: theme.radius.full,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    display: 'inline-block',
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    maxWidth: 600,
    margin: '0 auto',
    lineHeight: 1.5,
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    maxWidth: 1140,
    margin: '0 auto',
    gap: theme.spacing[6],
    flexWrap: 'wrap',
  },
  inputCard: {
    flex: '2 1 600px',
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[6],
    boxShadow: theme.shadows.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[5],
  },
  summaryCard: {
    flex: '1 1 350px',
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[6],
    boxShadow: theme.shadows.md,
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    position: 'sticky',
    top: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
  sectionLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: theme.spacing[3],
  },
  categoryBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.button,
    padding: `${theme.spacing[3]}px`,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium as any,
    color: theme.colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    ':hover': {
      borderColor: theme.colors.primary,
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    } as any,
  },
  categoryBtnActive: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    backgroundColor: theme.colors.primaryLight,
    border: `2px solid ${theme.colors.primary}`,
    borderRadius: theme.radius.button,
    padding: `${theme.spacing[3]}px`,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    cursor: 'pointer',
    outline: 'none',
  },
  icon: {
    color: theme.colors.textMuted,
  },
  iconActive: {
    color: theme.colors.primary,
  },
  selectInput: {
    padding: theme.spacing[3],
    borderRadius: theme.radius.input,
    border: `1px solid ${theme.colors.border}`,
    fontSize: theme.typography.size.sm,
    color: theme.colors.secondary,
    backgroundColor: '#FFFFFF',
    outline: 'none',
    cursor: 'pointer',
    ':focus': {
      borderColor: theme.colors.primary,
    } as any,
  },
  serviceDesc: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    lineHeight: 1.4,
    margin: 0,
    backgroundColor: '#F8FAFC',
    padding: theme.spacing[3],
    borderRadius: theme.radius.sm,
    borderLeft: `3px solid ${theme.colors.border}`,
  },
  materialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: theme.spacing[3],
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      borderColor: theme.colors.primary,
      boxShadow: theme.shadows.sm,
    } as any,
  },
  materialCardActive: {
    backgroundColor: '#F3F8FF',
    border: `2px solid ${theme.colors.primary}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    cursor: 'pointer',
  },
  materialCardTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
    marginBottom: 4,
  },
  materialCardText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 1.4,
    margin: 0,
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[4],
    flexWrap: 'wrap',
  },
  quantityInput: {
    width: 80,
    padding: theme.spacing[3],
    borderRadius: theme.radius.input,
    border: `1px solid ${theme.colors.border}`,
    fontSize: theme.typography.size.sm,
    textAlign: 'center',
    color: theme.colors.secondary,
    outline: 'none',
  },
  rangeSlider: {
    flex: 1,
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    outline: 'none',
    cursor: 'pointer',
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  summaryTitle: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  resetBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    ':hover': {
      color: theme.colors.primary,
    } as any,
  },
  priceRangeBox: {
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing[5],
    borderRadius: theme.radius.card,
    textAlign: 'center',
    marginBottom: theme.spacing[5],
  },
  rangeLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.primaryDark,
    fontWeight: theme.typography.weight.medium as any,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  rangeValue: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    marginVertical: theme.spacing[2],
  },
  taxInfo: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    margin: 0,
  },
  breakdownDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[5],
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
  },
  breakdownTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  infoAlert: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: theme.spacing[4],
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing[5],
    alignItems: 'flex-start',
  },
  infoAlertText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.4,
    margin: 0,
  },
  downloadCta: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[4],
    alignItems: 'flex-start',
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: theme.spacing[5],
  },
  downloadIconBox: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    padding: theme.spacing[3],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadCtaTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
    marginBottom: 4,
  },
  downloadCtaText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 1.4,
    margin: 0,
    marginBottom: theme.spacing[3],
  },
  downloadBtn: {
    backgroundColor: theme.colors.primary,
    color: '#FFFFFF',
    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
    borderRadius: theme.radius.button,
    textDecoration: 'none',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: theme.colors.primaryDark,
    } as any,
  },
  faqSection: {
    maxWidth: 1140,
    margin: `${theme.spacing[8]}px auto 0 auto`,
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: theme.spacing[8],
  },
  faqTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    marginBottom: theme.spacing[5],
    textAlign: 'center',
  },
  faqGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: theme.spacing[6],
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[5],
  },
  faqQ: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.secondary,
    margin: 0,
    marginBottom: theme.spacing[2],
  },
  faqA: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    lineHeight: 1.5,
    margin: 0,
  },
});
