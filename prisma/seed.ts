import { PrismaClient, Role, CustomizationFieldType, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Wasana Bakers database...");

  // 1. Seed Initial SUPER_ADMIN account
  const adminEmail = process.env.ADMIN_EMAIL || "admin@wasanabakers.lk";
  const adminPassword = process.env.ADMIN_PASSWORD || "WasanaAdmin2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Wasana Super Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: "Wasana Super Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
      isActive: true,
    },
  });

  console.log(`✅ Admin account configured: ${admin.email} (Role: ${admin.role})`);

  // 2. Seed Development Branches in Kandy
  const branchesData = [
    {
      code: "KANDY-CITY",
      name: "Wasana Bakers - Kandy City Centre (Dalada Veediya)",
      address: "124 Dalada Veediya, Kandy",
      phone: "+94 81 223 4567",
      isActive: true,
    },
    {
      code: "KATUGASTOTA",
      name: "Wasana Bakers - Katugastota Main Branch",
      address: "45 Kurunegala Road, Katugastota, Kandy",
      phone: "+94 81 249 8899",
      isActive: true,
    },
    {
      code: "PERADENIYA",
      name: "Wasana Bakers - Peradeniya Road Branch",
      address: "310 Peradeniya Road, Kandy",
      phone: "+94 81 238 7766",
      isActive: true,
    },
  ];

  for (const b of branchesData) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: {
        name: b.name,
        address: b.address,
        phone: b.phone,
        isActive: b.isActive,
      },
      create: b,
    });
    console.log(`🏪 Seeded branch: ${branch.name} [${branch.code}]`);
  }

  // 3. Seed Cakes
  const cakesData = [
    {
      name: "Chocolate Bloom Cake",
      slug: "chocolate-bloom-cake",
      mainCategory: "Celebration Cakes",
      collectionCode: "S",
      designNumber: 1,
      catalogueCode: "S-01",
      isSeasonal: false,
      shortDescription:
        "Decadent dark chocolate sponge layered with Belgian chocolate ganache and handcrafted sugar blooms.",
      description:
        "Our signature chocolate masterpiece! Baked with rich imported cocoa, filled with silky dark chocolate ganache, and crowned with chocolate blooms and golden edible dust. Perfect for birthdays, anniversaries, and chocolate lovers in Kandy.",
      basePrice: new Prisma.Decimal("4500.00"),
      published: true,
      isActive: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1000&auto=format&fit=crop&q=80",
          altText: "Chocolate Bloom Cake - Wasana Bakers",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=1000&auto=format&fit=crop&q=80",
          altText: "Chocolate Bloom Cake slice view",
          isPrimary: false,
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=1000&auto=format&fit=crop&q=80",
          altText: "Chocolate Bloom Cake top decoration",
          isPrimary: false,
          sortOrder: 2,
        },
      ],
      customizationGroups: [
        {
          name: "Cake Weight (Size)",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 0,
          isActive: true,
          helperText: "Choose the ideal weight for your gathering",
          options: [
            { label: "1 kg (Serves 6-8 guests)", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "1.5 kg (Serves 10-12 guests)", priceAdjustment: new Prisma.Decimal("1200.00"), sortOrder: 1, isActive: true },
            { label: "2 kg (Serves 14-16 guests)", priceAdjustment: new Prisma.Decimal("2400.00"), sortOrder: 2, isActive: true },
          ],
        },
        {
          name: "Bloom & Ribbon Accent Colour",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 1,
          isActive: true,
          helperText: "Select your preferred theme color",
          options: [
            { label: "Classic Gold & Bronze", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "Blush Pink & Rose", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 1, isActive: true },
            { label: "Royal Ivory & Pearl", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 2, isActive: true },
          ],
        },
        {
          name: "Message on Cake",
          fieldType: CustomizationFieldType.TEXT,
          isRequired: false,
          sortOrder: 2,
          isActive: true,
          maxCharacters: 35,
          helperText: "Complimentary chocolate piping (e.g. 'Happy 25th Birthday Nuwan!')",
          options: [],
        },
        {
          name: "Special Instructions / Notes",
          fieldType: CustomizationFieldType.TEXTAREA,
          isRequired: false,
          sortOrder: 3,
          isActive: true,
          maxCharacters: 200,
          helperText: "Any specific instructions for our pastry chefs",
          options: [],
        },
      ],
    },
    {
      name: "Butter Cream Floral Cake",
      slug: "butter-cream-floral-cake",
      mainCategory: "Birthday Cakes",
      collectionCode: "G",
      designNumber: 43,
      catalogueCode: "G-43",
      isSeasonal: false,
      shortDescription:
        "Fluffy golden vanilla sponge layered with strawberry compote and adorned with handcrafted buttercream blossoms.",
      description:
        "A delicate and enchanting centerpiece featuring our velvety Swiss meringue buttercream flowers hand-piped petal by petal over soft, moist vanilla sponge. Baked fresh upon order at Wasana Bakers.",
      basePrice: new Prisma.Decimal("3800.00"),
      published: true,
      isActive: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1000&auto=format&fit=crop&q=80",
          altText: "Butter Cream Floral Cake G-43",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=1000&auto=format&fit=crop&q=80",
          altText: "Floral cake details",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
      customizationGroups: [
        {
          name: "Weight",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 0,
          isActive: true,
          helperText: "Select weight",
          options: [
            { label: "1 kg", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "1.5 kg", priceAdjustment: new Prisma.Decimal("1000.00"), sortOrder: 1, isActive: true },
            { label: "2 kg", priceAdjustment: new Prisma.Decimal("2000.00"), sortOrder: 2, isActive: true },
          ],
        },
        {
          name: "Floral Palette",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 1,
          isActive: true,
          helperText: "Hand-piped buttercream flower style",
          options: [
            { label: "Pastel Lavender & Pink", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "Sunlit Peach & Yellow", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 1, isActive: true },
            { label: "Pure White & Green Foliage", priceAdjustment: new Prisma.Decimal("200.00"), sortOrder: 2, isActive: true },
          ],
        },
        {
          name: "Piped Message",
          fieldType: CustomizationFieldType.TEXT,
          isRequired: false,
          sortOrder: 2,
          isActive: true,
          maxCharacters: 30,
          helperText: "Short greeting on the cake board",
          options: [],
        },
      ],
    },
    {
      name: "Birthday Celebration Cake",
      slug: "birthday-celebration-cake",
      mainCategory: "Mini Cakes",
      collectionCode: "ND",
      designNumber: 14,
      catalogueCode: "ND-14",
      isSeasonal: false,
      shortDescription:
        "Festive multi-tier celebration cake adorned with colorful macarons, sprinkles, and golden edible pearls.",
      description:
        "The ultimate birthday centerpiece! Features moist layers of your favorite sponge filled with light cream, crowned with French macarons, Belgian white chocolate drips, and celebration candles.",
      basePrice: new Prisma.Decimal("5200.00"),
      published: true,
      isActive: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1562440499-64c9a111f713?w=1000&auto=format&fit=crop&q=80",
          altText: "Birthday Celebration Cake ND-14",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=1000&auto=format&fit=crop&q=80",
          altText: "Birthday celebration cake cutting",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
      customizationGroups: [
        {
          name: "Size",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 0,
          isActive: true,
          helperText: "Choose size",
          options: [
            { label: "1.5 kg Standard Tier", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "2.5 kg Grand Party Tier", priceAdjustment: new Prisma.Decimal("2800.00"), sortOrder: 1, isActive: true },
          ],
        },
        {
          name: "Cake Sponge Flavor",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 1,
          isActive: true,
          helperText: "Select sponge recipe",
          options: [
            { label: "Classic Vanilla Butter", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "Rich Mocha Ribbon", priceAdjustment: new Prisma.Decimal("400.00"), sortOrder: 1, isActive: true },
            { label: "Red Velvet Delicacy", priceAdjustment: new Prisma.Decimal("600.00"), sortOrder: 2, isActive: true },
          ],
        },
        {
          name: "Birthday Greeting",
          fieldType: CustomizationFieldType.TEXT,
          isRequired: false,
          sortOrder: 2,
          isActive: true,
          maxCharacters: 40,
          helperText: "Name and birthday wish to pipe on the cake",
          options: [],
        },
        {
          name: "Special Instructions",
          fieldType: CustomizationFieldType.TEXTAREA,
          isRequired: false,
          sortOrder: 3,
          isActive: true,
          maxCharacters: 250,
          helperText: "Number of candles needed, delivery notes, etc.",
          options: [],
        },
      ],
    },
    {
      name: "Wasana Mini Cake M-01",
      slug: "wasana-mini-cake-m-01",
      mainCategory: "Mini Cakes",
      collectionCode: "M",
      designNumber: 1,
      catalogueCode: "M-01",
      isSeasonal: false,
      shortDescription:
        "Charming single-tier personal mini cake with pastel swirls and chocolate crispies.",
      description:
        "Designed for intimate celebrations, birthdays, or sweet gifting! Baked fresh daily in our Kandy kitchens with ultra-soft sponge and velvety whipped icing.",
      basePrice: new Prisma.Decimal("2400.00"),
      published: true,
      isActive: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=1000&auto=format&fit=crop&q=80",
          altText: "Wasana Mini Cake M-01",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      customizationGroups: [
        {
          name: "Flavor",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 0,
          isActive: true,
          options: [
            { label: "Vanilla Buttercream", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "Double Chocolate", priceAdjustment: new Prisma.Decimal("200.00"), sortOrder: 1, isActive: true },
          ],
        },
        {
          name: "Personal Greeting",
          fieldType: CustomizationFieldType.TEXT,
          isRequired: false,
          sortOrder: 1,
          isActive: true,
          maxCharacters: 25,
          helperText: "Short greeting (e.g. 'Best Wishes!')",
          options: [],
        },
      ],
    },
    {
      name: "Wasana New Year Special NY-01",
      slug: "wasana-new-year-special-ny-01",
      mainCategory: "Seasonal Cakes",
      collectionCode: "NY",
      designNumber: 1,
      catalogueCode: "NY-01",
      isSeasonal: true,
      shortDescription:
        "Rich spiced festive fruit cake loaded with cashews, candied peel, and honey glaze.",
      description:
        "A cherished Sri Lankan holiday tradition from Wasana Bakers! Aged with care and prepared with aromatic nutmeg, cinnamon, roasted cashews, and golden syrup.",
      basePrice: new Prisma.Decimal("4800.00"),
      published: true,
      isActive: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=1000&auto=format&fit=crop&q=80",
          altText: "New Year Special Cake NY-01",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      customizationGroups: [
        {
          name: "Weight",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 0,
          isActive: true,
          options: [
            { label: "1 kg (Standard Box)", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "2 kg (Gift Pack)", priceAdjustment: new Prisma.Decimal("3800.00"), sortOrder: 1, isActive: true },
          ],
        },
      ],
    },
    {
      name: "Edible Printed Photo Cake E-05",
      slug: "edible-printed-photo-cake-e-05",
      mainCategory: "Printed Cakes",
      collectionCode: "E",
      designNumber: 5,
      catalogueCode: "E-05",
      isSeasonal: false,
      shortDescription:
        "Custom high-definition edible photo printed on delicate sugar sheet over fresh celebration cake.",
      description:
        "Commemorate special milestones with your favorite memory printed in vivid, 100% edible food colors. Finished with piped shell borders.",
      basePrice: new Prisma.Decimal("4200.00"),
      published: true,
      isActive: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=1000&auto=format&fit=crop&q=80",
          altText: "Edible Printed Cake E-05",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      customizationGroups: [
        {
          name: "Size",
          fieldType: CustomizationFieldType.SINGLE_SELECT,
          isRequired: true,
          sortOrder: 0,
          isActive: true,
          options: [
            { label: "1.5 kg (Serves 10-12)", priceAdjustment: new Prisma.Decimal("0.00"), sortOrder: 0, isActive: true },
            { label: "2.5 kg (Serves 16-20)", priceAdjustment: new Prisma.Decimal("2400.00"), sortOrder: 1, isActive: true },
          ],
        },
        {
          name: "Piped Border Text",
          fieldType: CustomizationFieldType.TEXT,
          isRequired: false,
          sortOrder: 1,
          isActive: true,
          maxCharacters: 30,
          helperText: "Short greeting next to the printed image",
          options: [],
        },
      ],
    },
  ];

  for (const cake of cakesData) {
    // Check if cake exists by slug or catalogueCode
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: cake.slug },
          ...(cake.catalogueCode ? [{ catalogueCode: cake.catalogueCode }] : []),
        ],
      },
    });

    if (existing) {
      // Delete existing to cleanly re-seed with images and customization groups
      await prisma.product.delete({ where: { id: existing.id } });
    }

    const created = await prisma.product.create({
      data: {
        name: cake.name,
        slug: cake.slug,
        mainCategory: cake.mainCategory,
        collectionCode: cake.collectionCode,
        designNumber: cake.designNumber,
        catalogueCode: cake.catalogueCode,
        isSeasonal: cake.isSeasonal,
        shortDescription: cake.shortDescription,
        description: cake.description,
        basePrice: cake.basePrice,
        published: cake.published,
        isActive: cake.isActive,
        images: {
          create: cake.images,
        },
        customizationGroups: {
          create: cake.customizationGroups.map((g) => ({
            name: g.name,
            fieldType: g.fieldType,
            isRequired: g.isRequired,
            sortOrder: g.sortOrder,
            isActive: g.isActive,
            helperText: g.helperText,
            maxCharacters: g.maxCharacters,
            options: {
              create: g.options,
            },
          })),
        },
      },
    });

    console.log(`🎂 Seeded cake: [${created.catalogueCode || "NO-CODE"}] ${created.name} (/cakes/${created.slug})`);
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
