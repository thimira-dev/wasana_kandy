import { describe, it, expect } from "vitest";
import {
  productSchema,
  customizationGroupSchema,
  validateCustomerSelections,
} from "../lib/domain/validation";

describe("Product Validation Schemas", () => {
  it("validates a complete, valid draft product", () => {
    const validProduct = {
      name: "Chocolate Bloom Cake",
      slug: "chocolate-bloom-cake",
      description: "Rich dark chocolate cake with ganache.",
      basePrice: 4500,
      published: false,
      isActive: true,
      images: [],
      customizationGroups: [],
    };

    const parsed = productSchema.safeParse(validProduct);
    expect(parsed.success).toBe(true);
  });

  it("fails when product name is empty or too short", () => {
    const invalidProduct = {
      name: "A",
      slug: "a",
      description: "Rich chocolate cake.",
      basePrice: 4500,
      published: false,
    };

    const parsed = productSchema.safeParse(invalidProduct);
    expect(parsed.success).toBe(false);
  });

  it("fails when slug contains uppercase or invalid characters", () => {
    const invalidSlug = {
      name: "Chocolate Bloom Cake",
      slug: "Chocolate Bloom_Cake!",
      description: "Rich chocolate cake description.",
      basePrice: 4500,
      published: false,
    };

    const parsed = productSchema.safeParse(invalidSlug);
    expect(parsed.success).toBe(false);
  });

  it("fails when base price is negative", () => {
    const invalidPrice = {
      name: "Chocolate Bloom Cake",
      slug: "chocolate-bloom-cake",
      description: "Rich chocolate cake description.",
      basePrice: -100,
      published: false,
    };

    const parsed = productSchema.safeParse(invalidPrice);
    expect(parsed.success).toBe(false);
  });

  it("enforces primary image before publishing", () => {
    const publishedWithoutImage = {
      name: "Chocolate Bloom Cake",
      slug: "chocolate-bloom-cake",
      description: "Rich chocolate cake description.",
      basePrice: 4500,
      published: true, // published!
      images: [], // no images!
    };

    const parsed = productSchema.safeParse(publishedWithoutImage);
    expect(parsed.success).toBe(false);

    const publishedWithImage = {
      ...publishedWithoutImage,
      images: [
        {
          url: "https://example.com/cake.jpg",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    };

    const validParsed = productSchema.safeParse(publishedWithImage);
    expect(validParsed.success).toBe(true);
  });
});

describe("Customization Group Validation", () => {
  it("enforces that a required SINGLE_SELECT group must contain at least one active option", () => {
    const invalidGroup = {
      name: "Colour",
      fieldType: "SINGLE_SELECT",
      isRequired: true,
      isActive: true,
      options: [], // empty choices!
    };

    const parsed = customizationGroupSchema.safeParse(invalidGroup);
    expect(parsed.success).toBe(false);

    const validGroup = {
      ...invalidGroup,
      options: [
        { label: "Pink", priceAdjustment: 0, isActive: true, sortOrder: 0 },
      ],
    };

    const validParsed = customizationGroupSchema.safeParse(validGroup);
    expect(validParsed.success).toBe(true);
  });
});

describe("Customer Customization Enforcement", () => {
  const mockGroups = [
    {
      id: "grp-colour",
      name: "Frosting Colour",
      fieldType: "SINGLE_SELECT",
      isRequired: true,
      isActive: true,
      options: [
        { id: "opt-pink", label: "Blush Pink", isActive: true },
        { id: "opt-white", label: "Pure White", isActive: true },
      ],
    },
    {
      id: "grp-msg",
      name: "Cake Message",
      fieldType: "TEXT",
      isRequired: false,
      isActive: true,
      maxCharacters: 25,
      options: [],
    },
    {
      id: "grp-dietary",
      name: "Dietary Note",
      fieldType: "TEXTAREA",
      isRequired: true,
      isActive: true,
      maxCharacters: 100,
      options: [],
    },
  ];

  it("blocks continuation when required SINGLE_SELECT option is missing", () => {
    const selections = {
      "grp-colour": {}, // unselected
      "grp-msg": { textValue: "Happy Birthday" },
      "grp-dietary": { textValue: "Nut-free kitchen please" },
    };

    const result = validateCustomerSelections(mockGroups, selections);
    expect(result.isValid).toBe(false);
    expect(result.errors["grp-colour"]).toBe('Please select an option for "Frosting Colour".');
  });

  it("blocks continuation when required TEXT/TEXTAREA field is missing", () => {
    const selections = {
      "grp-colour": { optionId: "opt-pink" },
      "grp-msg": { textValue: "" },
      "grp-dietary": { textValue: "   " }, // empty whitespace
    };

    const result = validateCustomerSelections(mockGroups, selections);
    expect(result.isValid).toBe(false);
    expect(result.errors["grp-dietary"]).toBe('Please enter a value for "Dietary Note".');
  });

  it("blocks continuation when text input exceeds maxCharacters", () => {
    const selections = {
      "grp-colour": { optionId: "opt-pink" },
      "grp-msg": { textValue: "This greeting message is way longer than twenty-five characters!" },
      "grp-dietary": { textValue: "Nut-free kitchen" },
    };

    const result = validateCustomerSelections(mockGroups, selections);
    expect(result.isValid).toBe(false);
    expect(result.errors["grp-msg"]).toContain("cannot exceed 25 characters");
  });

  it("successfully passes when all required and optional rules are satisfied", () => {
    const selections = {
      "grp-colour": { optionId: "opt-white" },
      "grp-msg": { textValue: "Happy 30th Kasun!" },
      "grp-dietary": { textValue: "Eggless preparation" },
    };

    const result = validateCustomerSelections(mockGroups, selections);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });
});
