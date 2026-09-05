import { z } from "zod";

// ==========================================
// 1. Coupon Schema
// ==========================================
export const CouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Coupon code is required.")
      .max(50, "Coupon code must not exceed 50 characters.")
      .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, hyphens, and underscores."),
    description: z.string().nullable().optional(),
    discount_type: z.enum(["percentage", "fixed"], {
      message: "Discount type must be either percentage or fixed.",
    }),
    discount_value: z.coerce
      .number({ message: "Discount value must be a valid number." })
      .positive("Discount value must be a positive number."),
    min_purchase_amount: z.coerce
      .number({ message: "Min purchase amount must be a number." })
      .min(0, "Min purchase amount cannot be negative."),
    max_discount_amount: z.coerce
      .number({ message: "Max discount must be a number." })
      .min(0, "Max discount amount cannot be negative.")
      .nullable()
      .optional()
      .or(z.literal("")),
    valid_from: z.string().nullable().optional(),
    valid_to: z.string().nullable().optional(),
    usage_limit: z.coerce
      .number({ message: "Usage limit must be a number." })
      .int("Usage limit must be an integer.")
      .min(1, "Usage limit must be at least 1."),
    status: z.enum(["active", "inactive"]),
    visibility: z.enum(["public", "private", "activity"]),
    assigned_user_id: z.coerce
      .number()
      .nullable()
      .optional()
      .or(z.literal("")),
    activity_type: z.string().nullable().optional(),
    activity_threshold: z.coerce.number().min(1).nullable().optional(),
    activity_description: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // Percentage validation check
    if (data.discount_type === "percentage" && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "Percentage discount cannot exceed 100%.",
      });
    }

    // Fixed discount validation: Minimum purchase must be strictly greater than fixed discount value
    if (data.discount_type === "fixed" && data.min_purchase_amount > 0 && data.discount_value >= data.min_purchase_amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min_purchase_amount"],
        message: "Minimum purchase amount must be greater than the fixed discount value.",
      });
    }

    // Max discount cap validation: Max discount cannot exceed min purchase amount
    if (
      data.max_discount_amount !== "" &&
      data.max_discount_amount !== null &&
      data.max_discount_amount !== undefined &&
      data.min_purchase_amount > 0 &&
      Number(data.max_discount_amount) > Number(data.min_purchase_amount)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_discount_amount"],
        message: "Maximum discount cannot be larger than the minimum purchase amount.",
      });
    }

    // Date order check
    if (data.valid_from && data.valid_to && data.valid_to < data.valid_from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valid_to"],
        message: "Expiration date must be after or on the start date.",
      });
    }

    // Private coupon user assignment check
    if (data.visibility === "private" && !data.assigned_user_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assigned_user_id"],
        message: "Specific customer assignment is required for private coupons.",
      });
    }

    // Activity coupon checks
    if (data.visibility === "activity") {
      if (!data.activity_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["activity_type"],
          message: "Activity trigger type is required for activity coupons.",
        });
      }
      if (!data.activity_threshold || data.activity_threshold < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["activity_threshold"],
          message: "Threshold requirement must be 1 or higher.",
        });
      }
    }
  });

// ==========================================
// 2. Shipping Method Schema
// ==========================================
export const ShippingMethodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Shipping method name is required.")
    .max(100, "Name must not exceed 100 characters."),
  description: z.string().nullable().optional(),
  fee: z.coerce
    .number({ message: "Shipping fee must be a valid number." })
    .min(0, "Shipping fee cannot be negative."),
  is_free_shipping: z.coerce.number().min(0).max(1),
});

// ==========================================
// 3. Discount Schema
// ==========================================
export const DiscountSchema = z
  .object({
    name: z.string().trim().min(1, "Discount title is required."),
    discount_type: z.enum(["percentage", "fixed"]),
    discount_value: z.coerce.number().positive("Discount value must be greater than 0."),
    applies_to: z.enum(["all", "category", "product"]),
    category_id: z.coerce.number().nullable().optional(),
    product_id: z.coerce.number().nullable().optional(),
    valid_from: z.string().min(1, "Start date is required."),
    valid_to: z.string().min(1, "End date is required."),
    status: z.enum(["active", "inactive"]),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === "percentage" && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "Percentage discount cannot exceed 100%.",
      });
    }
    if (data.applies_to === "category" && !data.category_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category_id"],
        message: "Please select a specific category.",
      });
    }
    if (data.applies_to === "product" && !data.product_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["product_id"],
        message: "Please select a specific product.",
      });
    }
    if (data.valid_from && data.valid_to && data.valid_to < data.valid_from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valid_to"],
        message: "End date must be after or equal to start date.",
      });
    }
  });

// ==========================================
// 4. Order Status Schema
// ==========================================
export const OrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"], {
    message: "Invalid order status value.",
  }),
});

// Helper function to format Zod error messages into field-mapped errors
export function formatZodErrors<T>(error: z.ZodError<T>): Record<string, string> {
  const formatted: Record<string, string> = {};
  const issues = error?.issues || [];
  issues.forEach((err) => {
    if (err.path && err.path.length > 0) {
      const field = err.path[0].toString();
      if (!formatted[field]) {
        formatted[field] = err.message;
      }
    }
  });
  return formatted;
}
