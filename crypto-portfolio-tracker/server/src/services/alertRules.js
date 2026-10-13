/** Pure alert rule, kept free of imports so it is trivially unit-testable. */
export function isTriggered(condition, price, target) {
  if (price == null) return false;
  return condition === 'above' ? price >= target : price <= target;
}
