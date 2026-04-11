import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AdminLayout } from "@/components/layout/AdminLayout";

import { HomePage } from "@/pages/HomePage";
import { AboutPage } from "@/pages/AboutPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ContactPage } from "@/pages/ContactPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProductsLandingPage, ProductsBrowsePage, ProductDetailPage } from "@/pages/ProductsPage";
import { CertificatePage } from "@/pages/CertificatePage";
import { BrochurePage } from "@/pages/BrochurePage";

import { BoardPage } from "@/pages/board/BoardPage";
import { PostPage } from "@/pages/board/PostPage";
import { WritePage } from "@/pages/board/WritePage";

import { DashboardPage } from "@/pages/admin/DashboardPage";
import { VisualPage } from "@/pages/admin/VisualPage";
import { HomeProductsPage } from "@/pages/admin/HomeProductsPage";
import { ProductInfoPage } from "@/pages/admin/ProductInfoPage";
import { CertificateAdminPage } from "@/pages/admin/CertificateAdminPage";
import { BrochureAdminPage } from "@/pages/admin/BrochureAdminPage";
import { PageBannerAdminPage } from "@/pages/admin/PageBannerAdminPage";
import { ProductLandingAdminPage } from "@/pages/admin/ProductLandingAdminPage";
import { BoardsPage } from "@/pages/admin/BoardsPage";
import { MembersPage } from "@/pages/admin/MembersPage";
import { PostsPage } from "@/pages/admin/PostsPage";
import { InquiriesPage } from "@/pages/admin/InquiriesPage";

export default function App() {
  return (
    <Routes>
      {/* 일반 레이아웃 */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* 전용 콘텐츠 페이지 (board/:slug보다 먼저 매칭) */}
        <Route path="board/product/browse" element={<ProductsBrowsePage />} />
        <Route path="board/product/item/:id" element={<ProductDetailPage />} />
        <Route path="board/product" element={<ProductsLandingPage />} />
        <Route path="board/certificate" element={<CertificatePage />} />
        <Route path="board/brochure" element={<BrochurePage />} />

        {/* 일반 게시판 */}
        <Route path="board/:slug" element={<BoardPage />} />
        <Route path="board/:slug/write" element={<WritePage />} />
        <Route path="board/:slug/:postId" element={<PostPage />} />
        <Route path="board/:slug/:postId/edit" element={<WritePage />} />
      </Route>

      {/* 관리자 레이아웃 */}
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="visual" element={<VisualPage />} />
        <Route path="home-products" element={<HomeProductsPage />} />
        <Route path="products" element={<ProductInfoPage />} />
        <Route path="certificates" element={<CertificateAdminPage />} />
        <Route path="brochures" element={<BrochureAdminPage />} />
        <Route path="page-banners" element={<PageBannerAdminPage />} />
        <Route path="product-landing" element={<ProductLandingAdminPage />} />
        <Route path="boards" element={<BoardsPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="inquiries" element={<InquiriesPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
