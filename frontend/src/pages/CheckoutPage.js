import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from '../next/ReactRouterCompat';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import useMediaQuery from '../hooks/useMediaQuery';

const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;
const STEPS = ['Address', 'Review & Pay'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, subtotal, fetchCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'KE',
    phone: '',
  });
  const [note, setNote] = useState('');
  const [pricing, setPricing] = useState(null);
  const [txRef, setTxRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [shippingZones, setShippingZones] = useState([]);
  const [zoneId, setZoneId] = useState('');

  useEffect(() => {
    fetchCart();

    api.get('/shipping')
      .then((r) => setShippingZones(r.data.zones || []))
      .catch(() => {});
  }, [fetchCart]);

  useEffect(() => {
    const savedAddress = sessionStorage.getItem('hoodie_checkout_address');
    if (savedAddress || !user?.addresses?.length) return;
    const index = Math.max(0, Math.min(user.defaultAddress || 0, user.addresses.length - 1));
    setAddress(user.addresses[index]);
  }, [user]);

  const verifyPayment = useCallback(
    async (transactionId, txRefParam) => {
      setVerifying(true);
      setError('');

      try {
        const savedAddress = JSON.parse(
          sessionStorage.getItem('hoodie_checkout_address') || 'null'
        );

        const savedNote = sessionStorage.getItem('hoodie_checkout_note') || '';
        const savedCoupon = sessionStorage.getItem('hoodie_checkout_coupon') || '';
        const savedZoneId = sessionStorage.getItem('hoodie_checkout_zone') || '';

        if (!savedAddress) {
          setError('Session expired. Please restart checkout.');
          setVerifying(false);
          return;
        }

        const res = await api.post('/payments/verify', {
          transaction_id: transactionId,
          tx_ref: txRefParam,
          shippingAddress: savedAddress,
          customerNote: savedNote,
          couponCode: savedCoupon,
          shippingZoneId: savedZoneId || undefined,
        });

        sessionStorage.removeItem('hoodie_checkout_address');
        sessionStorage.removeItem('hoodie_checkout_note');
        sessionStorage.removeItem('hoodie_checkout_coupon');
        sessionStorage.removeItem('hoodie_checkout_zone');

        await fetchCart();

        navigate(`/order-confirmed/${res.data.order._id}`);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            'Payment verification failed. Please contact support.'
        );

        setVerifying(false);
      }
    },
    [navigate, fetchCart]
  );

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    const txRefParam = searchParams.get('tx_ref');
    const status = searchParams.get('status');

    if (transactionId && txRefParam) {
      if (status === 'cancelled') {
        setError('Payment was cancelled. You can try again.');
        return;
      }

      verifyPayment(transactionId, txRefParam);
    }
  }, [searchParams, verifyPayment]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        cartTotal: subtotal,
      });

      setCouponResult(res.data);
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid code.');
      setCouponResult(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const getEffectivePricing = () => {
    const selectedZone = shippingZones.find((z) => z._id === zoneId);

    const baseSubtotal = pricing?.subtotal ?? subtotal;

    const zoneFreeOver = selectedZone ? (selectedZone.freeOver ?? 5000) : null;
    const zoneShipping = selectedZone
      ? (zoneFreeOver && subtotal >= zoneFreeOver ? 0 : selectedZone.price)
      : 0;

    const baseShipping = pricing?.shipping ?? zoneShipping;

    const discount = couponResult?.discount || 0;

    return {
      subtotal: baseSubtotal,
      shipping: baseShipping,
      discount,
      total: Math.max(
        0,
        baseSubtotal + baseShipping - discount
      ),
    };
  };

  const setAddr = (k) => (e) =>
    setAddress((a) => ({
      ...a,
      [k]: e.target.value,
    }));

  const handleAddressNext = async (e) => {
    e.preventDefault();

    setError('');
    setProcessing(true);

    try {
      if (shippingZones.length > 0 && !zoneId) {
        setError('Please select a delivery zone.');
        setProcessing(false);
        return;
      }

      const res = await api.post('/payments/initiate', {
        shippingAddress: address,
        customerNote: note,
        couponCode: couponResult?.code || '',
        shippingZoneId: zoneId || undefined,
        paymentMethod: 'card',
      });

      setPricing(res.data.pricing);
      setTxRef(res.data.tx_ref);

      sessionStorage.setItem(
        'hoodie_checkout_address',
        JSON.stringify(address)
      );

      sessionStorage.setItem('hoodie_checkout_note', note);
      sessionStorage.setItem('hoodie_checkout_coupon', couponResult?.code || '');
      sessionStorage.setItem('hoodie_checkout_zone', zoneId || '');

      setStep(1);

      window.scrollTo(0, 0);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to prepare payment. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    setError('');
    setProcessing(true);

    try {
      if (shippingZones.length > 0 && !zoneId) {
        setError('Please select a delivery zone.');
        setProcessing(false);
        return;
      }

      const res = await api.post('/payments/initiate', {
        shippingAddress: address,
        customerNote: note,
        couponCode: couponResult?.code || '',
        shippingZoneId: zoneId || undefined,
        paymentMethod,
      });

      if (paymentMethod === 'cod') {
        sessionStorage.removeItem('hoodie_checkout_address');
        sessionStorage.removeItem('hoodie_checkout_note');
        sessionStorage.removeItem('hoodie_checkout_coupon');
        sessionStorage.removeItem('hoodie_checkout_zone');

        await fetchCart();

        navigate(`/order-confirmed/${res.data.orderId}`);
        return;
      }

      console.log('FLUTTERWAVE INIT RESPONSE:', res.data);

      const paymentLink =
        res.data?.paymentLink ||
        res.data?.data?.link ||
        res.data?.link ||
        res.data?.data ||
        null;

      if (!paymentLink) {
        console.log('❌ NO PAYMENT LINK FOUND:', res.data);

        setError('Failed to generate payment link.');
        setProcessing(false);

        return;
      }

      sessionStorage.setItem(
        'hoodie_checkout_address',
        JSON.stringify(address)
      );

      sessionStorage.setItem('hoodie_checkout_note', note);
      sessionStorage.setItem('hoodie_checkout_coupon', couponResult?.code || '');
      sessionStorage.setItem('hoodie_checkout_zone', zoneId || '');

      window.location.assign(paymentLink);
    } catch (err) {
      console.error('PAYMENT INIT ERROR:', err);

      setError(
        err.response?.data?.error ||
          err.message ||
          'Could not launch payment.'
      );

      setProcessing(false);
    }
  };

  const p = getEffectivePricing();

  const OrderSummary = () => (
    <div
      style={{
        ...s.summary,
        position: isMobile ? 'static' : 'sticky',
        top: isMobile ? 'unset' : 80,
      }}
    >
      <h3 style={s.summaryTitle}>ORDER SUMMARY</h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {cart.items?.map((item) => (
          <div
            key={item._id}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr auto',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                background: '#ede9e3',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 20,
                    opacity: 0.25,
                  }}
                >
                  👕
                </span>
              )}

              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#0a0a0a',
                  color: '#fff',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 7,
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.quantity}
              </span>
            </div>

            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
              </p>

              <p
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 8,
                  color: '#888',
                }}
              >
                {item.size} / {item.color}
              </p>
            </div>

            <span
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 11,
                whiteSpace: 'nowrap',
              }}
            >
              {fmt(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid #d0cdc9',
          paddingTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        {[
          ['Subtotal', fmt(p.subtotal)],
          ['Shipping', p.shipping === 0 ? 'FREE' : fmt(p.shipping)],
          ...(p.discount > 0 ? [['Discount', `−${fmt(p.discount)}`]] : []),
        ].map(([label, val]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
            }}
          >
            <span style={{ color: '#888' }}>{label}</span>

            <span
              style={{
                color:
                  val === 'FREE'
                    ? '#2a7a2a'
                    : val?.startsWith('−')
                    ? '#2a7a2a'
                    : undefined,
              }}
            >
              {val}
            </span>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #d0cdc9',
            paddingTop: 10,
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            TOTAL
          </span>

          <span
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 22,
            }}
          >
            {fmt(p.total)}
          </span>
        </div>
      </div>
    </div>
  );

  if (
    !cart.items?.length &&
    !verifying &&
    !searchParams.get('transaction_id')
  ) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 24,
        }}
      >
        <h2
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 36,
            textAlign: 'center',
          }}
        >
          YOUR CART IS EMPTY
        </h2>

        <Link to="/shop" style={s.btn}>
          SHOP NOW
        </Link>
      </div>
    );
  }

  if (verifying) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #d0cdc9',
            borderTopColor: '#0a0a0a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />

        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
            color: '#888',
            textAlign: 'center',
          }}
        >
          Verifying your payment...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#f5f3ef',
        minHeight: '100vh',
        padding: isMobile ? '24px 16px' : '40px 28px',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 22,
              letterSpacing: 4,
              color: '#0a0a0a',
              textDecoration: 'none',
            }}
          >
            {settings.storeName || 'HOODIE'}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((st, i) => (
              <React.Fragment key={st}>
                <span
                  style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 10,
                    color: i === step ? '#0a0a0a' : '#888',
                    fontWeight: i === step ? 700 : 400,
                  }}
                >
                  {st}
                </span>

                {i < STEPS.length - 1 && (
                  <span
                    style={{
                      color: '#d0cdc9',
                      margin: '0 8px',
                      fontSize: 10,
                    }}
                  >
                    ›
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
            gap: isMobile ? 24 : 40,
            alignItems: 'start',
          }}
        >
          <div>
            {error && <p style={s.error}>{error}</p>}

            {isMobile && <OrderSummary />}

            {step === 0 && (
              <form onSubmit={handleAddressNext}>
                <h2
                  style={{
                    ...s.sectionTitle,
                    fontSize: 'clamp(22px,4vw,28px)',
                  }}
                >
                  SHIPPING ADDRESS
                </h2>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <Field
                    label="FULL NAME"
                    value={address.fullName}
                    onChange={setAddr('fullName')}
                    required
                  />

                  <Field
                    label="PHONE NUMBER"
                    value={address.phone}
                    onChange={setAddr('phone')}
                    required
                  />

                  <Field
                    label="ADDRESS LINE 1"
                    value={address.line1}
                    onChange={setAddr('line1')}
                    required
                  />

                  <Field
                    label="ADDRESS LINE 2 (OPTIONAL)"
                    value={address.line2}
                    onChange={setAddr('line2')}
                  />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <Field
                      label="CITY"
                      value={address.city}
                      onChange={setAddr('city')}
                      required
                    />

                    <Field
                      label="STATE/COUNTY"
                      value={address.state}
                      onChange={setAddr('state')}
                      required
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <Field
                      label="POSTAL CODE"
                      value={address.postalCode}
                      onChange={setAddr('postalCode')}
                      required
                    />

                    <div>
                      <label style={s.label}>COUNTRY</label>

                      <select
                        value={address.country}
                        onChange={setAddr('country')}
                        style={s.input}
                      >
                        <option value="KE">Kenya</option>
                        <option value="UG">Uganda</option>
                        <option value="TZ">Tanzania</option>
                        <option value="RW">Rwanda</option>
                        <option value="ET">Ethiopia</option>
                        <option value="NG">Nigeria</option>
                        <option value="GH">Ghana</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                      </select>
                    </div>
                  </div>

                  {shippingZones.length > 0 && (
                    <div>
                      <label style={s.label}>DELIVERY ZONE REQUIRED</label>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {shippingZones.map((zone) => (
                          <label
                            key={zone._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              cursor: 'pointer',
                              padding: '10px 12px',
                              border: `1px solid ${
                                zoneId === zone._id ? '#0a0a0a' : '#d0cdc9'
                              }`,
                              background:
                                zoneId === zone._id ? '#0a0a0a' : 'transparent',
                            }}
                          >
                            <input
                              type="radio"
                              name="zone"
                              value={zone._id}
                              checked={zoneId === zone._id}
                              onChange={() => setZoneId(zone._id)}
                              style={{ accentColor: '#f5f3ef' }}
                            />

                            <span
                              style={{
                                flex: 1,
                                fontFamily: 'Space Mono, monospace',
                                fontSize: 10,
                                color:
                                  zoneId === zone._id ? '#f5f3ef' : '#0a0a0a',
                              }}
                            >
                              {zone.name}

                              {zone.regions?.length > 0 && (
                                <span
                                  style={{
                                    fontSize: 8,
                                    color:
                                      zoneId === zone._id ? '#aaa' : '#888',
                                  }}
                                >
                                  {' '}
                                  — {zone.regions.join(', ')}
                                </span>
                              )}
                            </span>

                            <span
                              style={{
                                fontFamily: 'Space Mono, monospace',
                                fontSize: 10,
                                color:
                                  zoneId === zone._id ? '#f5f3ef' : '#0a0a0a',
                              }}
                            >
                              {(() => {
                                const freeOver = zone.freeOver ?? 5000;
                                const effectivePrice = freeOver && subtotal >= freeOver ? 0 : zone.price;
                                return effectivePrice === 0 ? 'FREE' : fmt(effectivePrice);
                              })()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={s.label}>ORDER NOTE (OPTIONAL)</label>

                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      style={{
                        ...s.input,
                        resize: 'vertical',
                      }}
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    ...s.btn,
                    width: '100%',
                    marginTop: 24,
                  }}
                  disabled={processing}
                >
                  {processing ? 'LOADING...' : 'REVIEW ORDER →'}
                </button>
              </form>
            )}

            {step === 1 && (
              <div>
                <h2
                  style={{
                    ...s.sectionTitle,
                    fontSize: 'clamp(22px,4vw,28px)',
                  }}
                >
                  REVIEW & PAY
                </h2>

                <div
                  style={{
                    padding: '14px',
                    border: '1px solid #d0cdc9',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 10,
                    color: '#888',
                    marginBottom: 20,
                  }}
                >
                  <strong style={{ color: '#0a0a0a' }}>Shipping to:</strong>

                  <br />

                  {address.fullName}, {address.line1}, {address.city},{' '}
                  {address.state}

                  <br />

                  {address.phone}

                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    style={{
                      display: 'block',
                      marginTop: 8,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 9,
                      color: '#888',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    ← Edit address
                  </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={s.label}>PROMO CODE</label>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponResult(null);
                        setCouponError('');
                      }}
                      placeholder="ENTER CODE"
                      style={{
                        ...s.input,
                        flex: 1,
                        fontFamily: 'Space Mono, monospace',
                        letterSpacing: 2,
                      }}
                      disabled={!!couponResult}
                    />

                    {couponResult ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCouponResult(null);
                          setCouponCode('');
                        }}
                        style={s.secBtn}
                      >
                        REMOVE
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        style={s.btn}
                      >
                        {couponLoading ? '...' : 'APPLY'}
                      </button>
                    )}
                  </div>

                  {couponError && (
                    <p
                      style={{
                        fontFamily: 'Space Mono, monospace',
                        fontSize: 9,
                        color: '#e03030',
                        marginTop: 6,
                      }}
                    >
                      ✕ {couponError}
                    </p>
                  )}

                  {couponResult && (
                    <p
                      style={{
                        fontFamily: 'Space Mono, monospace',
                        fontSize: 9,
                        color: '#2a7a2a',
                        marginTop: 6,
                      }}
                    >
                      ✓{' '}
                      {couponResult.description ||
                        `${couponResult.code} — saving ${fmt(
                          couponResult.discount
                        )}`}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={s.label}>PAYMENT METHOD</label>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <PayMethod
                      active={paymentMethod === 'card'}
                      onClick={() => setPaymentMethod('card')}
                      icon="💳"
                      title="Card / M-Pesa"
                      desc="Visa, Mastercard, M-Pesa, Airtel Money via Flutterwave"
                    />

                    <PayMethod
                      active={paymentMethod === 'cod'}
                      onClick={() => setPaymentMethod('cod')}
                      icon="💵"
                      title="Cash on Delivery"
                      desc="Pay when your order arrives — Nairobi deliveries only"
                    />
                  </div>
                </div>

                {paymentMethod === 'cod' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(224,112,0,.07)',
                      border: '1px solid rgba(224,112,0,.25)',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 9,
                      color: '#e07000',
                      lineHeight: 1.7,
                      marginBottom: 20,
                    }}
                  >
                    ⚠ Cash on Delivery is available for Nairobi deliveries only.
                    Have the exact amount ready when your rider arrives.
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={processing}
                  style={{
                    ...s.btn,
                    width: '100%',
                    fontSize: 12,
                    padding: 16,
                  }}
                >
                  {processing
                    ? 'PROCESSING...'
                    : paymentMethod === 'cod'
                    ? `PLACE ORDER — ${fmt(p.total)}`
                    : `PAY ${fmt(p.total)} →`}
                </button>

                {paymentMethod === 'card' && (
                  <p
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 9,
                      color: '#888',
                      marginTop: 10,
                      textAlign: 'center',
                    }}
                  >
                    🔒 Secured by Flutterwave — PCI DSS compliant
                  </p>
                )}
              </div>
            )}
          </div>

          {!isMobile && <OrderSummary />}
        </div>
      </div>
    </div>
  );
}

function PayMethod({ active, onClick, icon, title, desc }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        border: `1px solid ${active ? '#0a0a0a' : '#d0cdc9'}`,
        background: active ? '#0a0a0a' : 'transparent',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>

      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 10,
            color: active ? '#f5f3ef' : '#0a0a0a',
            fontWeight: 700,
          }}
        >
          {title}
        </p>

        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 8,
            color: active ? '#aaa' : '#888',
            marginTop: 2,
          }}
        >
          {desc}
        </p>
      </div>

      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${active ? '#f5f3ef' : '#d0cdc9'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {active && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#f5f3ef',
            }}
          />
        )}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label style={s.label}>{label}</label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        style={s.input}
      />
    </div>
  );
}

const s = {
  sectionTitle: {
    fontFamily: 'Anton, sans-serif',
    fontSize: 28,
    letterSpacing: 1,
    marginBottom: 20,
  },

  label: {
    display: 'block',
    fontFamily: 'Space Mono, monospace',
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#888',
    marginBottom: 6,
  },

  input: {
    width: '100%',
    border: '1px solid #d0cdc9',
    padding: '11px 12px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 13,
    background: 'transparent',
    outline: 'none',
  },

  btn: {
    display: 'inline-block',
    fontFamily: 'Space Mono, monospace',
    fontSize: 11,
    letterSpacing: 2,
    padding: '14px 24px',
    background: '#0a0a0a',
    color: '#f5f3ef',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
  },

  secBtn: {
    fontFamily: 'Space Mono, monospace',
    fontSize: 10,
    padding: '11px 16px',
    background: 'transparent',
    color: '#0a0a0a',
    border: '1px solid #d0cdc9',
    cursor: 'pointer',
  },

  error: {
    fontFamily: 'Space Mono, monospace',
    fontSize: 10,
    color: '#e03030',
    marginBottom: 16,
    padding: '10px 12px',
    background: 'rgba(224,48,48,.06)',
    border: '1px solid rgba(224,48,48,.2)',
  },

  summary: {
    background: '#ede9e3',
    padding: '24px 20px',
    marginBottom: 16,
  },

  summaryTitle: {
    fontFamily: 'Space Mono, monospace',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 16,
    borderBottom: '1px solid #d0cdc9',
    paddingBottom: 12,
  },
};
