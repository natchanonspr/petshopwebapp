const KEY = "petshop_admin_data_v1";

export function loadAdminData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || typeof saved !== "object")
      return {
        users: [],
        products: [],
        orders: [],
        coupons: [],
        notifications: [],
      };
    return saved;
  } catch {
    return {
      users: [],
      products: [],
      orders: [],
      coupons: [],
      notifications: [],
    };
  }
}
export function saveAdminData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("petshop-admin-data-updated"));
  return data;
}
export function resetAdminData() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("petshop-admin-data-updated"));
  return loadAdminData();
}
export function updateAdminData(mutator) {
  const data = loadAdminData();
  mutator(data);
  return saveAdminData(data);
}
export { KEY };
