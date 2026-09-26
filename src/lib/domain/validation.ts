import { z } from "zod";
import { isValidSriLankanPhone, normalizeSriLankanPhone } from "./phone-rules";
import { validateReadyDate } from "./date-rules";

export const CustomizationFieldTypeEnum = z.enum([
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "TEXT",
  "TEXTAREA",
  "IMAGE_UPLOAD",
]);

export type CustomizationFieldType = z.infer<typeof CustomizationFieldTypeEnum>;

export const customizationOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Option label is required").trim(),
  priceAdjustment: z
    .union([z.number(), z.string()])
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num);
    }, "Price adjustment must be a valid number")
    .default(0),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CustomizationOptionInput = z.infer<typeof customizationOptionSchema>;

export const customizationGroupSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Group name is required").trim(),
    fieldType: CustomizationFieldTypeEnum.default("SINGLE_SELECT"),
    isRequired: z.boolean().default(false),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
    helperText: z.string().optional().nullable(),
    maxCharacters: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((val) => (val ? Number(val) : null))
      .refine((val) => val === null || (Number.isInteger(val) && val > 0), {
        message: "Maximum characters must be a positive integer",
      })
      .optional()
      .nullable(),
    options: z.array(customizationOptionSchema).default([]),
  })
  .refine(
    (group) => {
      // If group is SINGLE_SELECT and isRequired, it must have at least one active option
      if (
        (group.fieldType === "SINGLE_SELECT" || group.fieldType === "MULTI_SELECT") &&
        group.isRequired &&
        group.isActive
      ) {
        const hasActiveOption = group.options.some((opt) => opt.isActive && opt.label.trim().length > 0);
        return hasActiveOption;
      }
      return true;
    },
    {
      message: "A required selection group must have at least one active choice",
      path: ["options"],
    }
  );

export type CustomizationGroupInput = z.infer<typeof customizationGroupSchema>;

export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1, "Image URL is required"),
  altText: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export type ProductImageInput = z.infer<typeof productImageSchema>;

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? val.trim() : "")),
    slug: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? val.trim() : ""))
      .refine(
        (val) => !val || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val),
        "Slug must contain only lowercase alphanumeric characters and hyphens"
      ),
    mainCategory: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
    collectionCode: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val && val.trim().length > 0 ? val.trim().toUpperCase() : null)),
    designNumber: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .nullable()
      .transform((val) => (val !== null && val !== undefined && val !== "" ? Number(val) : null)),
    catalogueCode: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
    isSeasonal: z.boolean().default(false),
    shortDescription: z.string().optional().nullable(),
    description: z.string().min(5, "Description must be at least 5 characters").trim(),
    basePrice: z
      .union([z.number(), z.string()])
      .refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      }, "Base price must be a non-negative number"),
    published: z.boolean().default(false),
    isActive: z.boolean().default(true),
    images: z.array(productImageSchema).default([]),
    customizationGroups: z.array(customizationGroupSchema).default([]),
  })
  .refine(
    (data) => {
      // Must have either a name of at least 2 chars OR a collection + design number
      const hasName = Boolean(data.name && data.name.length >= 2);
      const hasCode = Boolean(
        data.catalogueCode || (data.collectionCode && data.designNumber !== null && data.designNumber > 0)
      );
      return hasName || hasCode;
    },
    {
      message: "Please provide either a cake name or a valid collection and design number",
      path: ["name"],
    }
  )
  .refine(
    (data) => {
      // Primary image required before publishing
      if (data.published) {
        const hasPrimary = data.images.some((img) => img.isPrimary && img.url.trim().length > 0);
        const hasAnyImage = data.images.some((img) => img.url.trim().length > 0);
        return hasPrimary || hasAnyImage;
      }
      return true;
    },
    {
      message: "At least one primary cake image is required before publishing",
      path: ["images"],
    }
  );

export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/**
 * Validates customer selections against configured customization groups
 */
export interface CustomerCustomizationSelections {
  [groupId: string]: {
    optionId?: string; // For SINGLE_SELECT
    optionIds?: string[]; // For MULTI_SELECT
    textValue?: string; // For TEXT / TEXTAREA
  };
}

export interface CustomizationValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateCustomerSelections(
  groups: Array<{
    id: string;
    name: string;
    fieldType: string;
    isRequired: boolean;
    isActive: boolean;
    maxCharacters?: number | null;
    options: Array<{ id: string; label: string; isActive: boolean }>;
  }>,
  selections: CustomerCustomizationSelections
): CustomizationValidationResult {
  const errors: Record<string, string> = {};

  for (const group of groups) {
    if (!group.isActive) continue;

    const selection = selections[group.id];

    if (group.fieldType === "SINGLE_SELECT") {
      const selectedOptionId = selection?.optionId;
      if (group.isRequired) {
        if (!selectedOptionId) {
          errors[group.id] = `Please select an option for "${group.name}".`;
          continue;
        }
      }

      if (selectedOptionId) {
        const optionExists = group.options.find(
          (opt) => opt.id === selectedOptionId && opt.isActive
        );
        if (!optionExists) {
          errors[group.id] = `Selected option for "${group.name}" is invalid or unavailable.`;
        }
      }
    } else if (group.fieldType === "TEXT" || group.fieldType === "TEXTAREA") {
      const textVal = selection?.textValue?.trim() || "";

      if (group.isRequired && !textVal) {
        errors[group.id] = `Please enter a value for "${group.name}".`;
        continue;
      }

      if (group.maxCharacters && textVal.length > group.maxCharacters) {
        errors[group.id] = `"${group.name}" cannot exceed ${group.maxCharacters} characters (currently ${textVal.length}).`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export const checkoutDetailsSchema = z.object({
  customerName: z.string().min(2, "Please enter your full name").trim(),
  customerEmail: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  phonePrimary: z
    .string()
    .min(1, "Please enter your primary contact number")
    .refine(
      (val) => isValidSriLankanPhone(val),
      "Please enter a valid Sri Lankan phone number (e.g. 0771234567 or +94771234567)"
    )
    .transform(normalizeSriLankanPhone),
  phoneSecondary: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim().length === 0 || isValidSriLankanPhone(val),
      "Secondary phone number must be a valid Sri Lankan phone number"
    )
    .transform((val) => (val && val.trim().length > 0 ? normalizeSriLankanPhone(val) : null)),
  branchId: z.string().min(1, "Please select a pickup branch"),
  readyDate: z
    .string()
    .min(1, "Please select a cake ready date")
    .superRefine((dateStr, ctx) => {
      const check = validateReadyDate(dateStr);
      if (!check.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: check.error || "Cake ready date must be at least 4 days from today.",
        });
      }
    }),
});

export type CheckoutDetailsInput = z.infer<typeof checkoutDetailsSchema>;

export const createOrderSchema = checkoutDetailsSchema.extend({
  productId: z.string().min(1, "Product ID is required"),
  selections: z.record(
    z.string(),
    z.object({
      optionId: z.string().optional(),
      optionIds: z.array(z.string()).optional(),
      textValue: z.string().optional(),
    })
  ),
  idempotencyKey: z.string().optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

