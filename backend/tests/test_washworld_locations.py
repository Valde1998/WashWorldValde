import unittest

from washworld_locations import WASHWORLD_LOCATIONS, location_records


class WashWorldLocationTests(unittest.TestCase):
    def test_official_location_list_has_71_unique_entries(self):
        records = list(location_records())

        self.assertEqual(len(records), 71)
        self.assertEqual(len({record["slug"] for record in records}), 71)
        self.assertEqual(len({record["address"] for record in records}), 71)

    def test_every_location_has_navigation_and_address_data(self):
        for record in location_records():
            self.assertRegex(record["postal_code"], r"^\d{4}$")
            self.assertTrue(record["city"])
            self.assertTrue(record["source_url"].startswith("https://washworld.dk/"))
            self.assertGreater(record["halls_count"], 0)
            self.assertGreater(record["latitude"], 54)
            self.assertLess(record["latitude"], 58)
            self.assertGreater(record["longitude"], 8)
            self.assertLess(record["longitude"], 13)

    def test_raw_tuple_shape_is_stable(self):
        self.assertTrue(all(len(location) == 9 for location in WASHWORLD_LOCATIONS))


if __name__ == "__main__":
    unittest.main()
