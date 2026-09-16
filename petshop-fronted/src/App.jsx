import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminUserSync from './components/AdminUserSync.jsx'

import Home from './pages/home/Home.jsx'
import Pets from './pages/pets/Pets.jsx'
import PetDetail from './pages/pets/PetDetail.jsx'
import Recommendation from './pages/recommendation/Recommendation.jsx'

import Products from './pages/products/Products.jsx'
import ProductDetail from './pages/product-detail/ProductDetail.jsx'

import Cart from './pages/cart/Cart.jsx'
import Checkout from './pages/cart/Checkout.jsx'
import OrderSuccess from './pages/cart/OrderSuccess.jsx'
import Payment from './pages/cart/Payment.jsx'
import PaymentSlip from './pages/cart/PaymentSlip.jsx'

import Orders from './pages/orders/Orders.jsx'
import OrderDetail from './pages/orders/OrderDetail.jsx'

import Profile from './pages/profile/Profile.jsx'
import ProfileSettings from './pages/profile/ProfileSettings.jsx'
import EditProfile from './pages/profile/EditProfile.jsx'
import Help from './pages/profile/Help.jsx'
import Coupons from './pages/profile/Coupons.jsx'
import Favorites from './pages/profile/Favorites.jsx'

import Notifications from './pages/notifications/Notifications.jsx'

import AdminRoute from './pages/admin/AdminRoute.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminOrderDetail from './pages/admin/AdminOrderDetail.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import AdminCustomers from './pages/admin/AdminCustomers.jsx'
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail.jsx'
import AdminCoupons from './pages/admin/AdminCoupons.jsx'
import AdminNotifications from './pages/admin/AdminNotifications.jsx'
import AdminSettings from './pages/admin/AdminSettings.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import AdminStore from './pages/admin/AdminStore.jsx'

import Login from './pages/auth/Login.jsx'
import AuthMock from './pages/auth/AuthMock.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import PasswordLoginMock from './pages/auth/PasswordLoginMock.jsx'

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('petshop_token')

    if (!token) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default function App() {
    return (
        <BrowserRouter>
            <AdminUserSync />

            <Routes>

                {/* =========================
            Auth
        ========================= */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login/password" element={<PasswordLoginMock />} />
                <Route path="/register" element={<AuthMock mode="register" />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />


                {/* =========================
            User
        ========================= */}

                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/pets"
                    element={
                        <ProtectedRoute>
                            <Pets />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/pets/:petId"
                    element={
                        <ProtectedRoute>
                            <PetDetail />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/recommendation"
                    element={
                        <ProtectedRoute>
                            <Recommendation />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <Products />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/products/:productId"
                    element={
                        <ProtectedRoute>
                            <ProductDetail />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute>
                            <Cart />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute>
                            <Checkout />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/payment/:orderId"
                    element={<Payment />}
                />

                <Route
                    path="/payment/:orderId/slip"
                    element={<PaymentSlip />}
                />

                <Route
                    path="/orders/success"
                    element={
                        <ProtectedRoute>
                            <OrderSuccess />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/orders/:orderId"
                    element={
                        <ProtectedRoute>
                            <OrderDetail />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/edit"
                    element={
                        <ProtectedRoute>
                            <EditProfile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/addresses"
                    element={
                        <ProtectedRoute>
                            <ProfileSettings type="addresses" />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/payment"
                    element={
                        <ProtectedRoute>
                            <ProfileSettings type="payment" />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/favorites"
                    element={
                        <ProtectedRoute>
                            <Favorites />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/coupons"
                    element={
                        <ProtectedRoute>
                            <Coupons />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/help"
                    element={
                        <ProtectedRoute>
                            <Help />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
            Admin
        ========================= */}

                <Route
                    path="/home/admin/login"
                    element={<AdminLogin />}
                />

                <Route
                    path="/home/admin"
                    element={
                        <AdminRoute>
                            <AdminLayout />
                        </AdminRoute>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:id" element={<AdminOrderDetail />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="customers/:userId" element={<AdminCustomerDetail />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="store" element={<AdminStore />} />
                    <Route path="settings" element={<AdminSettings />} />
                </Route>


                {/* Unknown */}
                <Route
                    path="*"
                    element={<Navigate to="/home" replace />}
                />

            </Routes>
        </BrowserRouter>
    )
}