"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiUrl, adminToken, getImageUrl } from "../../common/http";
import { toggleWishlist } from "../../common/wishlist";
import Layout from "../../components/Layouts";
import { useCart } from "../../contexts/CartContext";
import {
  Star, ShoppingBag, Heart, Share2, Truck, ShieldCheck,
  RotateCcw, ChevronRight, ArrowLeft, Crown, Clock,
  CheckCircle2, XCircle, Minus, Plus, Sparkles, Gem,
  ChevronLeft, Package, MessageSquare, HelpCircle, Send, User, Lock,
} from "lucide-react";

// ─── Types ───
interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
}

interface ProductVariant {
  id: number;
  product_id: number;
  color: string;        // used as description/label in our system
  image?: string;
  additional_price: number;
  stock_quantity: number;
}

interface ProductDetail {
  id: number;
  name: string;
  sku: string;
  description: string;
  base_price: number;
  stock_quantity: number;
  weight: number;
  is_seasonal: boolean;
  seasonal_start_date?: string;
  seasonal_end_date?: string;
  status: string;
  category_id?: number;
  brand_id?: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

interface ReviewItem {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
  user?: { id: number; name: string; email: string };
  created_at: string;
}

interface ProductChatItem {
  id: number;
  product_id: number;
  user_id?: number;
  customer_name?: string;
  customer_email?: string;
  question: string;
  reply?: string;
  replied_by?: number;
  replied_at?: string;
  status: "pending" | "replied";
  user?: { id: number; name: string; email: string };
  replier?: { id: number; name: string; email: string };
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductDetail[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeDiscountInfo, setActiveDiscountInfo] = useState<{
    discountPercent: number;
    salePrice: number;
    originalPrice: number;
  } | null>(null);

  // Review states
  const [canReview, setCanReview] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotification, setReviewNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Product Chat / Question states
  const [chats, setChats] = useState<ProductChatItem[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [guestNameInput, setGuestNameInput] = useState("");
  const [guestEmailInput, setGuestEmailInput] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [chatNotification, setChatNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Pagination states (5 items per page)
  const ITEMS_PER_PAGE = 5;
  const [reviewPage, setReviewPage] = useState(1);
  const [chatPage, setChatPage] = useState(1);

  // Sync user details for questions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("adminUser");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u) {
            setCurrentUser(u);
            if (u.name) setGuestNameInput(u.name);
            if (u.email) setGuestEmailInput(u.email);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Submit product chat question
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;

    setSubmittingQuestion(true);
    setChatNotification(null);

    try {
      const res = await fetch(`${apiUrl}/products/${productId}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          question: questionInput.trim(),
          user_id: currentUser?.id || null,
          customer_name: currentUser?.name || guestNameInput.trim() || "Guest Patron",
          customer_email: currentUser?.email || guestEmailInput.trim() || "",
        }),
      });

      const data = await res.json();
      setSubmittingQuestion(false);

      if (res.ok && (data.status === 201 || data.status === 200)) {
        setQuestionInput("");
        setChatNotification({
          type: "success",
          message: data.message || "Your question has been submitted! An atelier representative will reply shortly.",
        });

        // Refresh chats list (sorted by recents)
        const chatRes = await fetch(`${apiUrl}/products/${productId}/chats`);
        const chatData = await chatRes.json().catch(() => ({}));
        if (chatData.data) {
          const sortedChats = (chatData.data as ProductChatItem[]).sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          setChats(sortedChats);
          setChatPage(1);
        }
      } else {
        setChatNotification({
          type: "error",
          message: data.message || "Failed to submit question.",
        });
      }
    } catch (err) {
      setSubmittingQuestion(false);
      setChatNotification({
        type: "error",
        message: "Failed to connect to backend server.",
      });
    }
  };

  // Check eligibility for review
  useEffect(() => {
    const checkEligible = async () => {
      try {
        const storedUser = localStorage.getItem("adminUser");
        let userId = "";
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            if (u && u.id) userId = u.id;
          } catch (e) {}
        }
        const res = await fetch(`${apiUrl}/reviews/check-eligibility?product_id=${productId}&user_id=${userId}`);
        const data = await res.json();
        if (data.can_review) {
          setCanReview(true);
          if (data.existing_review) {
            setHasExistingReview(true);
            setRatingInput(data.existing_review.rating);
            setCommentInput(data.existing_review.comment || "");
          } else {
            setHasExistingReview(false);
          }
        } else {
          setCanReview(false);
          setHasExistingReview(false);
        }
      } catch (err) {
        console.error("Error checking review eligibility:", err);
      }
    };
    if (productId) checkEligible();
  }, [productId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewNotification(null);

    try {
      const storedUser = localStorage.getItem("adminUser");
      let userId = 1;
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u && u.id) userId = u.id;
        } catch (e) {}
      }

      const reqHeaders: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      const token = adminToken();
      if (token) {
        reqHeaders["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/reviews`, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          user_id: userId,
          product_id: Number(productId),
          rating: ratingInput,
          comment: commentInput,
        }),
      });

      const data = await res.json().catch(() => ({ message: "Server error occurred during submission." }));
      setSubmittingReview(false);

      if (!res.ok) {
        setReviewNotification({
          type: "error",
          message: data.message || "Failed to post review. Verified delivered acquisition required.",
        });
        return;
      }

      setHasExistingReview(true);
      setReviewNotification({
        type: "success",
        message: data.message || (hasExistingReview ? "Your review has been updated successfully!" : "Your patron review has been recorded!"),
      });

      // Refresh reviews list
      const revRes = await fetch(`${apiUrl}/reviews`);
      const revData = await revRes.json().catch(() => ({}));
      if (revData.data) {
        setReviews((revData.data as ReviewItem[]).filter((r) => r.product_id === Number(productId)));
      }
    } catch (err) {
      setSubmittingReview(false);
      setReviewNotification({
        type: "error",
        message: "Failed to connect to backend server.",
      });
    }
  };

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = adminToken();
        const headers: HeadersInit = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        // Fetch product + reviews + all products + variants + discounts + chats
        const [prodRes, revRes, allRes, variantRes, discRes, chatRes] = await Promise.all([
          fetch(`${apiUrl}/products/${productId}`, { headers }),
          fetch(`${apiUrl}/reviews`, { headers }),
          fetch(`${apiUrl}/products`, { headers }),
          fetch(`${apiUrl}/product-variants?product_id=${productId}`),
          fetch(`${apiUrl}/discounts`, { headers }).catch(() => null),
          fetch(`${apiUrl}/products/${productId}/chats`).catch(() => null),
        ]);

        const prodData = await prodRes.json();
        const revData = await revRes.json();
        const allData = await allRes.json();
        const variantData = await variantRes.json();
        const discData = discRes ? await discRes.json().catch(() => ({})) : {};
        const chatData = chatRes ? await chatRes.json().catch(() => ({})) : {};

        if (chatData && chatData.data) {
          const sortedChats = (chatData.data as ProductChatItem[]).sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          setChats(sortedChats);
        }

        const productVariants: ProductVariant[] = Array.isArray(variantData.data)
          ? variantData.data
          : Array.isArray(variantData)
          ? variantData
          : [];
        setVariants(productVariants);

        if (prodData.success || prodData.data) {
          const currentProd = prodData.data;
          setProduct(currentProd);

          // Find active discount for this product
          const discountList = discData.data || discData || [];
          const now = new Date();
          const matchedDiscount = Array.isArray(discountList)
            ? discountList.find((d: any) => {
                const matchesTarget = (d.product_id && Number(d.product_id) === Number(currentProd.id)) ||
                  (d.category_id && Number(d.category_id) === Number(currentProd.category_id || currentProd.category?.id));
                if (!matchesTarget) return false;
                if (d.valid_from) {
                  const validFrom = new Date(d.valid_from);
                  if (typeof d.valid_from === 'string' && d.valid_from.length <= 10) validFrom.setHours(0, 0, 0, 0);
                  if (!isNaN(validFrom.getTime()) && validFrom > now) return false;
                }
                if (d.valid_to) {
                  const validTo = new Date(d.valid_to);
                  if (typeof d.valid_to === 'string' && d.valid_to.length <= 10) validTo.setHours(23, 59, 59, 999);
                  if (!isNaN(validTo.getTime()) && validTo < now) return false;
                }
                return true;
              })
            : null;

          if (matchedDiscount) {
            const basePrice = Number(currentProd.base_price);
            const discountValue = Number(matchedDiscount.discount_value || 0);
            const discountPercent = matchedDiscount.discount_type === 'percentage'
              ? discountValue
              : Math.max(1, Math.round((discountValue / basePrice) * 100));

            const salePrice = matchedDiscount.discount_type === 'percentage'
              ? Math.round(basePrice * (1 - discountPercent / 100))
              : Math.max(0, basePrice - discountValue);

            setActiveDiscountInfo({
              discountPercent,
              salePrice,
              originalPrice: basePrice,
            });
          } else {
            setActiveDiscountInfo(null);
          }
        }

        // Filter and sort reviews for this product (Highest rating to lowest rating)
        const allReviews: ReviewItem[] = revData.data || [];
        const sortedRev = allReviews
          .filter((r) => r.product_id === Number(productId))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0) || new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setReviews(sortedRev);

        // Set related products (same category, exclude current)
        if (allData.data && prodData.data) {
          const allProds: ProductDetail[] = allData.data;
          setRelatedProducts(
            allProds
              .filter((p) => p.category_id === prodData.data.category_id && p.id !== prodData.data.id)
              .slice(0, 4)
          );
        }
        // Check initial wishlist status
        if (token) {
          try {
            const wishRes = await fetch(`${apiUrl}/wishlists`, { headers });
            const wishData = await wishRes.json();
            const storedUser = localStorage.getItem("adminUser");
            if (storedUser && wishData.data) {
              const u = JSON.parse(storedUser);
              const exists = wishData.data.some((w: any) => w.user_id === u.id && Number(w.product_id) === Number(productId));
              setIsWishlisted(exists);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  const baseVal = activeDiscountInfo ? activeDiscountInfo.salePrice : Number(product?.base_price ?? 0);
  const displayPrice = selectedVariant
    ? baseVal + Number(selectedVariant.additional_price)
    : baseVal;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name + (selectedVariant ? ` (${selectedVariant.color})` : ""),
      base_price: displayPrice,
      stock_quantity: selectedVariant ? Number(selectedVariant.stock_quantity) : Number(product.stock_quantity),
    } as any);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlist = async () => {
    if (!product) return;
    const res = await toggleWishlist(product.id);
    if (res.success) {
      setIsWishlisted(res.added);
    }
  };

  const formatPrice = (price: number) =>
    `৳${Math.round(price).toLocaleString()}`;

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-[#C5A059] fill-[#C5A059]" : "text-[#E8E2D5]"}`} />
    ));

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-6 w-32 bg-[#E8E2D5] rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="aspect-square bg-[#E8E2D5] rounded-2xl" />
              <div className="space-y-4">
                <div className="h-4 w-24 bg-[#E8E2D5] rounded" />
                <div className="h-8 w-3/4 bg-[#E8E2D5] rounded" />
                <div className="h-4 w-1/2 bg-[#E8E2D5] rounded" />
                <div className="h-12 w-1/3 bg-[#E8E2D5] rounded" />
                <div className="h-20 w-full bg-[#E8E2D5] rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center mb-6">
            <Package className="w-8 h-8 text-[#8C6D2B]" />
          </div>
          <h2 className="text-3xl font-serif text-[#1C1A17] mb-2">Masterpiece Not Found</h2>
          <p className="text-sm text-[#5A554C] mb-8">The piece you're looking for has been vaulted or doesn't exist.</p>
          <button onClick={() => router.push("/shop")} className="px-8 py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all rounded-xl">
            Return to Gallery
          </button>
        </div>
      </Layout>
    );
  }

  const images = product.images || [];
  const avgRating = reviews.length > 0 ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const effectiveStock = selectedVariant ? Number(selectedVariant.stock_quantity) : Number(product.stock_quantity);
  const inStock = effectiveStock > 0 && product.status === "active";

  // Determine the main image source: variant thumbnail takes priority when selected
  const variantImageUrl = selectedVariant?.image ? getImageUrl(selectedVariant.image) : null;
  const mainImageSrc = variantImageUrl
    ? variantImageUrl
    : images.length > 0
    ? getImageUrl(images[selectedImage]?.image_url || images[0]?.image_url)
    : null;

  return (
    <Layout>
      <div className="bg-[#FAF8F5] text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ─── Breadcrumbs ─── */}
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#7A7468] mb-6">
            <button onClick={() => router.push("/")} className="hover:text-[#1C1A17] transition-colors">Maison Home</button>
            <span className="text-[#C5A059]">•</span>
            <button onClick={() => router.push("/shop")} className="hover:text-[#1C1A17] transition-colors">Gallery</button>
            <span className="text-[#C5A059]">•</span>
            {product.category && <span className="hover:text-[#1C1A17] transition-colors cursor-pointer">{product.category.name}</span>}
            <span className="text-[#C5A059]">•</span>
            <span className="text-[#1C1A17] font-semibold truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* ─── BACK BUTTON ─── */}
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase tracking-wider">Return</span>
          </button>

          {/* ═══════════════════════════════════════════ */}
          {/* MAIN PRODUCT SECTION */}
          {/* ═══════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

            {/* ─── LEFT: IMAGE GALLERY ─── */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-[#E8E2D5] shadow-sm group">
                {mainImageSrc ? (
                  <img
                    src={mainImageSrc}
                    alt={selectedVariant ? `${product.name} - ${selectedVariant.color}` : product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EFECE6] flex items-center justify-center">
                    <span className="text-[#9E988D] text-sm font-semibold uppercase tracking-widest">{product.name}</span>
                  </div>
                )}

                {/* Image navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setSelectedImage((p) => (p > 0 ? p - 1 : images.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                      <ChevronLeft className="w-5 h-5 text-[#1C1A17]" />
                    </button>
                    <button onClick={() => setSelectedImage((p) => (p < images.length - 1 ? p + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                      <ChevronRight className="w-5 h-5 text-[#1C1A17]" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {Boolean(product.is_seasonal) && (
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#8C6D2B] border border-[#C5A059]/40 text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Seasonal
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button onClick={handleWishlist}
                    className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
                      isWishlisted ? "text-rose-600" : "text-[#1C1A17] hover:text-rose-600"
                    }`}>
                    <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-600" : ""}`} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-[#1C1A17] hover:scale-110 transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-[10px] font-mono font-bold text-[#8C6D2B]">
                    {selectedImage + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails strip */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {/* Product gallery thumbnails */}
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => { setSelectedImage(idx); setSelectedVariant(null); }}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      !variantImageUrl && idx === selectedImage
                        ? "border-[#C5A059] ring-2 ring-[#C5A059]/30"
                        : "border-[#E8E2D5] hover:border-[#C5A059]/60"
                    }`}
                  >
                    <img src={getImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {/* Variant thumbnails */}
                {variants.filter(v => v.image).map((v) => (
                  <button
                    key={`var-${v.id}`}
                    onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all relative ${
                      selectedVariant?.id === v.id
                        ? "border-[#C5A059] ring-2 ring-[#C5A059]/30"
                        : "border-[#E8E2D5] hover:border-[#C5A059]/60"
                    }`}
                  >
                    <img src={getImageUrl(v.image!)} alt={v.color} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5 font-bold truncate px-1">
                      {v.color}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── RIGHT: PRODUCT INFO ─── */}
            <div className="space-y-6">
              {/* Brand & Category */}
              <div>
                {product.brand && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B]">{product.brand.name}</span>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <h1 className="text-3xl sm:text-4xl font-serif text-[#1C1A17] tracking-tight">{product.name}</h1>
                </div>
                {product.category && (
                  <p className="text-xs text-[#5A554C] mt-1">{product.category.name} • SKU: {product.sku}</p>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">{renderStars(avgRating)}</div>
                <span className="text-sm font-mono font-bold text-[#8C6D2B]">
                  {reviews.length > 0 ? avgRating.toFixed(1) : "0.0"}
                </span>
                <span className="text-xs text-[#5A554C]">({reviews.length} reviews)</span>
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 ${
                  inStock ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-700"
                }`}>
                  {inStock ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {inStock ? "In Stock" : "Sold Out"}
                </span>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl font-serif font-bold text-[#1C1A17]">
                    {formatPrice(
                      activeDiscountInfo
                        ? activeDiscountInfo.salePrice + (selectedVariant ? Number(selectedVariant.additional_price) : 0)
                        : displayPrice
                    )}
                  </span>

                  {activeDiscountInfo && (
                    <>
                      <span className="text-xl text-[#9E988D] line-through font-light">
                        {formatPrice(
                          activeDiscountInfo.originalPrice + (selectedVariant ? Number(selectedVariant.additional_price) : 0)
                        )}
                      </span>
                      <span className="bg-rose-900 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        -{activeDiscountInfo.discountPercent}% OFF
                      </span>
                    </>
                  )}

                  {selectedVariant && Number(selectedVariant.additional_price) > 0 && (
                    <span className="text-xs text-[#8C6D2B] font-semibold block w-full mt-1">
                      + {formatPrice(Number(selectedVariant.additional_price))} ({selectedVariant.color})
                    </span>
                  )}
                </div>
                {product.weight && Number(product.weight) > 0 && (
                  <p className="text-xs text-[#6E685E] font-medium pt-1">
                    Weight: <span className="font-bold text-[#1C1A17]">{product.weight} kg</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="border-t border-b border-[#E8E2D5] py-5">
                <p className="text-sm text-[#5A554C] leading-relaxed font-light">
                  {product.description || "A masterfully curated piece from our exclusive atelier collection."}
                </p>
              </div>

              {/* ─── Variations Selector ─── */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D2B] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Variation Options
                    </span>
                    {selectedVariant && (
                      <button
                        onClick={() => setSelectedVariant(null)}
                        className="text-[10px] text-[#8C6D2B] hover:text-[#1C1A17] font-bold uppercase tracking-wider transition-colors"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      const outOfStock = v.stock_quantity <= 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => setSelectedVariant(isSelected ? null : v)}
                          className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all duration-200 ${
                            isSelected
                              ? "border-[#C5A059] bg-[#FDF6E8] text-[#1C1A17] shadow-md ring-2 ring-[#C5A059]/30"
                              : outOfStock
                              ? "border-[#E8E2D5] bg-[#FAF8F5] text-[#BBBBBB] cursor-not-allowed opacity-50"
                              : "border-[#E8E2D5] bg-white hover:border-[#C5A059] hover:shadow-sm text-[#1C1A17]"
                          }`}
                        >
                          {v.image && (
                            <img
                              src={getImageUrl(v.image)}
                              alt={v.color}
                              className="w-7 h-7 rounded-lg object-cover border border-[#E8E2D5] flex-shrink-0"
                            />
                          )}
                          <span>{v.color}</span>
                          {v.additional_price > 0 && (
                            <span className={`ml-1 text-[10px] font-mono ${
                              isSelected ? "text-[#8C6D2B]" : "text-[#8C6D2B]"
                            }`}>
                              +{formatPrice(v.additional_price)}
                            </span>
                          )}
                          {outOfStock && (
                            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              Out
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 bg-[#C5A059] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedVariant && (
                    <p className="text-[11px] text-[#5A554C]">
                      <span className="font-semibold text-[#1C1A17]">{selectedVariant.color}</span> selected
                      {" · "}{selectedVariant.stock_quantity} in stock
                    </p>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D2B]">Quantity</span>
                <div className="flex items-center border border-[#E8E2D5] rounded-xl bg-white shadow-sm">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-[#1C1A17] hover:bg-[#FAF8F5] transition-colors rounded-l-xl">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 py-3 font-mono font-bold text-[#1C1A17] min-w-[3rem] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                    className="px-4 py-3 text-[#1C1A17] hover:bg-[#FAF8F5] transition-colors rounded-r-xl">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] text-[#5A554C]">{effectiveStock} available</span>
              </div>

              {/* Add to Cart Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex-1 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md flex items-center justify-center gap-3 ${
                    addedToCart
                      ? "bg-emerald-600 text-white"
                      : inStock
                      ? "bg-[#1C1A17] hover:bg-[#C5A059] text-white hover:shadow-xl hover:-translate-y-0.5"
                      : "bg-[#E8E2D5] text-[#9E988D] cursor-not-allowed"
                  }`}
                >
                  <ShoppingBag className={`w-4 h-4 ${addedToCart ? "" : "text-[#D4AF37]"}`} />
                  {addedToCart ? "✓ Added to Cart" : inStock ? "Acquire Masterpiece" : "Vault Reserved"}
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-[#E8E2D5]">
                  <Truck className="w-5 h-5 text-[#C5A059]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#1C1A17]">Free Shipping</p>
                    <p className="text-[9px] text-[#5A554C]">On orders over ৳20,000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-[#E8E2D5]">
                  <RotateCcw className="w-5 h-5 text-[#C5A059]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#1C1A17]">Easy Returns</p>
                    <p className="text-[9px] text-[#5A554C]">30-day concierge</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-[#E8E2D5]">
                  <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#1C1A17]">Authenticity</p>
                    <p className="text-[9px] text-[#5A554C]">Certificate included</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-[#E8E2D5]">
                  <Gem className="w-5 h-5 text-[#C5A059]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#1C1A17]">Premium Packaging</p>
                    <p className="text-[9px] text-[#5A554C]">Signature linen box</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* REVIEWS SECTION */}
          {/* ═══════════════════════════════════════════ */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Patron Feedback</span>
                <h2 className="text-2xl font-serif text-[#1C1A17]">Client Reviews</h2>
              </div>
              <div className="flex items-center gap-2 bg-white/80 border border-[#E8E2D5] rounded-xl px-4 py-2 shadow-sm">
                <div className="flex gap-0.5">{renderStars(avgRating || 5)}</div>
                <span className="text-sm font-bold text-[#1C1A17]">{avgRating || 5}.0</span>
                <span className="text-xs text-[#5A554C]">({reviews.length})</span>
              </div>
            </div>

            {/* Review Form / Eligibility Banner */}
            <div className="mb-8 p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              {canReview ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-serif font-bold text-[#1C1A17]">
                        {hasExistingReview ? "Edit Your Patron Review" : "Write Your Patron Review"}
                      </h3>
                      <p className="text-[11px] text-[#5A554C]">
                        {hasExistingReview ? "You have already reviewed this item. Updating will replace your existing review." : "Verified Acquisition • Share your experience with this item"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-5 h-5 ${star <= ratingInput ? "fill-[#C5A059] text-[#C5A059]" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Describe the craftsmanship, quality, and overall experience..."
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl p-3 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] transition-all resize-none font-medium"
                    required
                  />

                  {reviewNotification && (
                    <div className={`p-3 rounded-lg text-xs font-semibold ${reviewNotification.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
                      {reviewNotification.message}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md disabled:opacity-50"
                    >
                      {submittingReview ? (hasExistingReview ? "Updating Review..." : "Submitting Review...") : (hasExistingReview ? "Update Review" : "Submit Review")}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-3 text-xs text-[#5A554C]">
                  <ShieldCheck className="w-5 h-5 text-[#8C6D2B] flex-shrink-0" />
                  <p>
                    <strong className="text-[#1C1A17] font-semibold">Verified Acquisition Required:</strong> Reviews are strictly reserved for patrons with a confirmed delivered order for this product.
                  </p>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-white/80 rounded-2xl border border-[#E8E2D5]">
                <Heart className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
                <p className="text-sm font-serif text-[#1C1A17] mb-1">No reviews yet</p>
                <p className="text-xs text-[#5A554C]">Be the first to share your experience with this masterpiece.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.slice((reviewPage - 1) * ITEMS_PER_PAGE, reviewPage * ITEMS_PER_PAGE).map((review) => (
                  <div key={review.id} className="bg-white/80 rounded-xl border border-[#E8E2D5] p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1C1A17] flex items-center justify-center text-[#D4AF37] text-sm font-bold font-mono">
                          {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-serif font-semibold text-[#1C1A17]">{review.user?.name || "Anonymous Patron"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex gap-0.5">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-[10px] text-[#5A554C]">
                              {new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#5A554C] leading-relaxed">{review.comment}</p>
                  </div>
                ))}

                {/* Reviews Pagination Controls */}
                {Math.ceil(reviews.length / ITEMS_PER_PAGE) > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E8E2D5] text-xs">
                    <span className="text-[#5A554C]">
                      Showing <strong className="text-[#1C1A17]">{((reviewPage - 1) * ITEMS_PER_PAGE) + 1}</strong> to <strong className="text-[#1C1A17]">{Math.min(reviewPage * ITEMS_PER_PAGE, reviews.length)}</strong> of <strong className="text-[#1C1A17]">{reviews.length}</strong> reviews (Highest Rating First)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReviewPage((prev) => Math.max(prev - 1, 1))}
                        disabled={reviewPage === 1}
                        className="px-3.5 py-1.5 bg-white border border-[#E8E2D5] rounded-xl text-xs font-bold uppercase tracking-wider text-[#1C1A17] hover:border-[#C5A059] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Prev
                      </button>
                      <span className="font-mono font-bold text-xs text-[#1C1A17] px-2">
                        {reviewPage} / {Math.ceil(reviews.length / ITEMS_PER_PAGE)}
                      </span>
                      <button
                        onClick={() => setReviewPage((prev) => Math.min(prev + 1, Math.ceil(reviews.length / ITEMS_PER_PAGE)))}
                        disabled={reviewPage === Math.ceil(reviews.length / ITEMS_PER_PAGE)}
                        className="px-3.5 py-1.5 bg-white border border-[#E8E2D5] rounded-xl text-xs font-bold uppercase tracking-wider text-[#1C1A17] hover:border-[#C5A059] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ═══════════════════════════════════════════ */}
          {/* PRODUCT CHAT / LIVE INQUIRY SECTION */}
          {/* ═══════════════════════════════════════════ */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
                  Concierge Live Support
                </span>
                <h2 className="text-2xl font-serif text-[#1C1A17] flex items-center gap-2">
                  <span>Product Questions & Live Chat</span>
                  <span className="text-xs font-mono font-normal bg-[#1C1A17]/5 text-[#8C6D2B] px-2.5 py-1 rounded-full border border-[#E8E2D5]">
                    {chats.length} {chats.length === 1 ? "Inquiry" : "Inquiries"}
                  </span>
                </h2>
              </div>
            </div>

            {/* Question Submission Form */}
            <div className="mb-8 p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              {currentUser && currentUser.id ? (
                <form onSubmit={handleQuestionSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HelpCircle className="w-4 h-4 text-[#8C6D2B]" />
                    <h3 className="text-sm font-serif font-bold text-[#1C1A17]">
                      Ask a Question About This Product
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#5A554C]">
                    Have a question about materials, fit, availability, or customization? Send us an inquiry and our atelier team will respond directly.
                  </p>

                  {/* Profile Identity Bar */}
                  <div className="flex items-center gap-2 p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5]">
                    <div className="w-6 h-6 rounded-full bg-[#1C1A17] flex items-center justify-center text-[#D4AF37] text-[10px] font-bold">
                      {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="text-xs">
                      <span className="font-serif font-bold text-[#1C1A17]">
                        {currentUser.name}
                      </span>
                      {currentUser.email && (
                        <span className="text-[10px] text-[#8C6D2B] font-mono ml-2">
                          ({currentUser.email})
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1C1A17] mb-1">
                      Your Question / Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="Ask anything about this artifact (e.g. dimensions, care instructions, stock restock date)..."
                      className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl p-3 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] transition-all resize-none font-medium"
                      required
                    />
                  </div>

                  {chatNotification && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        chatNotification.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {chatNotification.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{chatNotification.message}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingQuestion || !questionInput.trim()}
                      className="px-6 py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      {submittingQuestion ? (
                        <span>Sending Question...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Submit Question</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1C1A17]/5 border border-[#E8E2D5] flex items-center justify-center text-[#8C6D2B] shrink-0">
                      <Lock className="w-5 h-5 text-[#8C6D2B]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-serif font-bold text-[#1C1A17]">Sign In to Ask Questions</h4>
                      <p className="text-[11px] text-[#5A554C]">
                        Only registered patrons and customers can submit product inquiries to our atelier support team.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/auth/login?redirect=/products/${productId}`)}
                    className="px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shrink-0 shadow-sm"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}
            </div>

            {/* Questions Thread List */}
            {chats.length === 0 ? (
              <div className="text-center py-12 bg-white/80 rounded-2xl border border-[#E8E2D5]">
                <MessageSquare className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
                <p className="text-sm font-serif text-[#1C1A17] mb-1">No questions asked yet</p>
                <p className="text-xs text-[#5A554C]">Have any doubts? Feel free to ask a question above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chats.slice((chatPage - 1) * ITEMS_PER_PAGE, chatPage * ITEMS_PER_PAGE).map((chatItem) => (
                  <div
                    key={chatItem.id}
                    className="bg-white/90 rounded-2xl border border-[#E8E2D5] p-6 shadow-sm space-y-4"
                  >
                    {/* Customer Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center text-[#8C6D2B] text-sm font-bold font-serif">
                          {chatItem.customer_name?.charAt(0)?.toUpperCase() || chatItem.user?.name?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-serif font-semibold text-[#1C1A17]">
                              {chatItem.customer_name || chatItem.user?.name || "Patron Customer"}
                            </p>
                            {chatItem.user && (
                              <span className="bg-[#1C1A17]/5 text-[#5A554C] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                                Verified Customer
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#5A554C] block mt-0.5">
                            {new Date(chatItem.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {chatItem.status === "replied" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Replied</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Reply</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D5]">
                      <p className="text-xs text-[#1C1A17] font-medium leading-relaxed">
                        "{chatItem.question}"
                      </p>
                    </div>

                    {/* Admin Response Block */}
                    {chatItem.reply ? (
                      <div className="pl-4 sm:pl-6 border-l-2 border-[#C5A059] space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1C1A17] flex items-center justify-center text-[#D4AF37]">
                            <Crown className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-serif font-bold text-[#1C1A17]">
                            Maison Atelier Concierge
                          </span>
                          {chatItem.replied_at && (
                            <span className="text-[10px] text-[#5A554C]">
                              • {new Date(chatItem.replied_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A554C] leading-relaxed bg-[#FFFDF9] p-3.5 rounded-xl border border-[#D4AF37]/30">
                          {chatItem.reply}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-[#8C6D2B] font-light">
                        Our atelier support concierge will review and reply to this inquiry shortly.
                      </p>
                    )}
                  </div>
                ))}

                {/* Chats Pagination Controls */}
                {Math.ceil(chats.length / ITEMS_PER_PAGE) > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E8E2D5] text-xs">
                    <span className="text-[#5A554C]">
                      Showing <strong className="text-[#1C1A17]">{((chatPage - 1) * ITEMS_PER_PAGE) + 1}</strong> to <strong className="text-[#1C1A17]">{Math.min(chatPage * ITEMS_PER_PAGE, chats.length)}</strong> of <strong className="text-[#1C1A17]">{chats.length}</strong> inquiries (Most Recent First)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChatPage((prev) => Math.max(prev - 1, 1))}
                        disabled={chatPage === 1}
                        className="px-3.5 py-1.5 bg-white border border-[#E8E2D5] rounded-xl text-xs font-bold uppercase tracking-wider text-[#1C1A17] hover:border-[#C5A059] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Prev
                      </button>
                      <span className="font-mono font-bold text-xs text-[#1C1A17] px-2">
                        {chatPage} / {Math.ceil(chats.length / ITEMS_PER_PAGE)}
                      </span>
                      <button
                        onClick={() => setChatPage((prev) => Math.min(prev + 1, Math.ceil(chats.length / ITEMS_PER_PAGE)))}
                        disabled={chatPage === Math.ceil(chats.length / ITEMS_PER_PAGE)}
                        className="px-3.5 py-1.5 bg-white border border-[#E8E2D5] rounded-xl text-xs font-bold uppercase tracking-wider text-[#1C1A17] hover:border-[#C5A059] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ═══════════════════════════════════════════ */}
          {/* RELATED PRODUCTS */}
          {/* ═══════════════════════════════════════════ */}
          {relatedProducts.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Curated Selection</span>
                  <h2 className="text-2xl font-serif text-[#1C1A17]">You May Also Desire</h2>
                </div>
                <button onClick={() => router.push("/shop")}
                  className="text-xs font-bold uppercase tracking-wider text-[#8C6D2B] hover:text-[#1C1A17] transition-colors flex items-center gap-1">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((rp) => (
                  <div key={rp.id}
                    onClick={() => router.push(`/products/${rp.id}`)}
                    className="bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden border border-[#E8E2D5] hover:border-[#C5A059] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  >
                    <div className="aspect-[4/5] bg-[#EFECE6] relative overflow-hidden">
                      {rp.images?.[0] ? (
                        <img src={getImageUrl(rp.images[0].image_url)} alt={rp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EFECE6] flex items-center justify-center">
                          <span className="text-[#9E988D] text-xs font-semibold uppercase tracking-widest text-center px-4">{rp.name}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">{rp.brand?.name || ""}</p>
                      <h3 className="text-sm font-serif font-semibold text-[#1C1A17] mt-0.5 line-clamp-1">{rp.name}</h3>
                      <p className="text-base font-mono font-bold text-[#1C1A17] mt-2">{formatPrice(rp.base_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </Layout>
  );
}
