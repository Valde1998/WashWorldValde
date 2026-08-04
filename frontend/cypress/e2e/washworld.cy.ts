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

  it("filters locations and logs in", () => {
    cy.visit("/");

    cy.contains("Vaskehal dashboard");
    cy.get('input[aria-label="Søg efter vaskehal"]').type("Viby");
    cy.contains("Viby");
    cy.contains("Tilst").should("not.exist");

    cy.contains("button", "Log ind").click();
    cy.contains("Gem profil");
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
