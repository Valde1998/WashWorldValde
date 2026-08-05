describe("WashWorld dashboard", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/dashboard", {
      totals: {
        locations: 3,
        plans: 3,
        users: 1,
        washes: 3,
        average_queue: 4,
      },
      washes_per_day: [
        { day: "2026-08-01", washes: 1 },
        { day: "2026-08-02", washes: 2 },
      ],
    });

    cy.intercept("GET", "**/api/locations", [
      {
        location_id: 1,
        name: "WashWorld Tilst",
        city: "Tilst",
        address: "Blomstervej 12",
        opening_hours: "06:00 - 22:00",
        queue_minutes: 4,
        image: "/location-tilst.webp",
      },
      {
        location_id: 2,
        name: "WashWorld Viby",
        city: "Viby",
        address: "Sonderhoj 9",
        opening_hours: "06:00 - 22:00",
        queue_minutes: 7,
        image: "/location-viby.webp",
      },
    ]);

    cy.intercept("GET", "**/api/plans", [
      {
        plan_id: 1,
        name: "Basis",
        description: "Til enkel bilvask.",
        monthly_price: 99,
        single_wash_price: 79,
      },
      {
        plan_id: 2,
        name: "Plus",
        description: "Fri vask i fast vaskehal.",
        monthly_price: 149,
        single_wash_price: 99,
      },
    ]);

    cy.intercept("POST", "**/api/login", {
      token: "test-token",
      user: {
        user_id: "11111111111111111111111111111111",
        first_name: "Demo",
        email: "demo@washworld.dk",
        license_plate: "AB 12345",
        phone: "12345678",
        location_id: 1,
        location_name: "WashWorld Tilst",
        location_city: "Tilst",
        plan_id: 2,
        plan_name: "Plus",
        monthly_price: 149,
      },
    });

    cy.intercept("GET", "**/api/me", {
      user_id: "11111111111111111111111111111111",
      first_name: "Demo",
      email: "demo@washworld.dk",
      license_plate: "AB 12345",
      phone: "12345678",
      location_id: 1,
      location_name: "WashWorld Tilst",
      location_city: "Tilst",
      plan_id: 2,
      plan_name: "Plus",
      monthly_price: 149,
    });

    cy.intercept("GET", "**/api/wash-history", []);
  });

  it("logs in and filters locations", () => {
    cy.visit("/");

    cy.contains("Ren bil. Nemt medlemskab.");
    cy.contains("button", "Log ind").click();
    cy.contains("h1", "Log ind");
    cy.contains("button", "Log ind").click();
    cy.contains("Hej, Demo");

    cy.contains("button", "Vaskehaller").click();
    cy.get('input[aria-label="Søg efter vaskehal"]').type("Viby");
    cy.contains("Viby");
    cy.contains("Tilst").should("not.exist");
  });

  it("validates email before signup can continue", () => {
    cy.visit("/");
    cy.contains("button", "Bliv medlem").click();
    cy.contains("h1", "Dine oplysninger");

    cy.contains("label", "Navn").find("input").type("Valde");
    cy.get('input[type="email"]').eq(0).type("ikke-en-email");
    cy.get('input[type="email"]').eq(1).type("ikke-en-email");
    cy.contains("label", "Kodeord").find("input").type("kodeord123");
    cy.contains("label", "Nummerplade").find("input").type("AB 12345");
    cy.contains("button", "Fortsæt").click();

    cy.contains("Indtast en gyldig emailadresse");
    cy.contains("h1", "Dine oplysninger");
  });

  it("requires and verifies the emailed signup code", () => {
    cy.intercept("POST", "**/api/login", {
      statusCode: 403,
      body: {
        error: "Bekræft din email, før du logger ind",
        verification_required: true,
        email: "demo@washworld.dk",
      },
    }).as("pendingLogin");
    cy.intercept("POST", "**/api/resend-verification", {
      message: "En ny bekræftelseskode er sendt",
    }).as("resendCode");
    cy.intercept("POST", "**/api/verify-email", {
      token: "verified-token",
      user: {
        user_id: "11111111111111111111111111111111",
        first_name: "Demo",
        email: "demo@washworld.dk",
        license_plate: "AB 12345",
        phone: "12345678",
        location_id: 1,
        location_name: "WashWorld Tilst",
        location_city: "Tilst",
        plan_id: 2,
        plan_name: "Plus",
        monthly_price: 149,
      },
    }).as("verifyEmail");

    cy.visit("/");
    cy.contains("button", "Log ind").click();
    cy.contains("button", "Log ind").click();
    cy.wait("@pendingLogin");
    cy.contains("h1", "Bekræft din email");
    cy.contains("demo@washworld.dk");

    cy.contains("button", "Send en ny kode").click();
    cy.wait("@resendCode");
    cy.contains("En ny bekræftelseskode er sendt");

    cy.get('input[aria-label="Bekræftelseskode"]').type("123456");
    cy.contains("button", "Bekræft og log ind").click();
    cy.wait("@verifyEmail").its("request.body").should("deep.equal", {
      email: "demo@washworld.dk",
      code: "123456",
    });
    cy.contains("Hej, Demo");
  });

  it("clears an expired session and returns to login", () => {
    cy.intercept("GET", "**/api/me", {
      statusCode: 401,
      body: { error: "Token has expired" },
    }).as("expiredSession");

    cy.visit("/", {
      onBeforeLoad(window) {
        window.localStorage.setItem("washworld_token", "expired-token");
      },
    });

    cy.wait("@expiredSession");
    cy.contains("Din session er udløbet. Log ind igen.");
    cy.contains("button", "Log ind");
    cy.window().its("localStorage").invoke("getItem", "washworld_token").should("be.null");
  });
});
