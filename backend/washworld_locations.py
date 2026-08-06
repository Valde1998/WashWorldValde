"""Hardcoded Danish WashWorld locations from the official location finder.

Source: https://washworld.dk/find-wash-world-vaskehal
Checked: 2026-08-05
"""

SOURCE_URL = "https://washworld.dk/find-wash-world-vaskehal"
SOURCE_CHECKED_ON = "2026-08-05"

# slug, name, full address, type, latitude, longitude, opening hours,
# number of automatic wash halls, number of self-service bays
WASHWORLD_LOCATIONS = [
    ("vordingborg-valdemarsgade", "Vordingborg - Valdemarsgade", "Valdemarsgade 57, 4760 Vordingborg", "washhall", 55.010855159280844, 11.910488605499268, "7-22", 2, 0),
    ("viby-gunnar-clausens-vej", "Viby - Gunnar Clausens vej", "Gunnar Clausens Vej 2A, 8260 Viby", "both", 56.111373, 10.125033, "7-22", 2, 1),
    ("viborg-vognmagervej", "Viborg - Vognmagervej", "Vognmagervej 21E, 8800 Viborg", "washhall", 56.469365758210174, 9.409430623054504, "7-22", 2, 0),
    ("viborg-falkevej", "Viborg - Falkevej", "Falkevej 25, 8800 Viborg", "washhall", 56.444161, 9.388456, "7-22", 2, 0),
    ("vejle-solkilde-alle", "Vejle - Solkilde Allé", "Solkilde Alle 11, 7100 Vejle", "washhall", 55.72345860000001, 9.584777799999983, "7-22", 2, 0),
    ("vejle-soldalen", "Vejle - Soldalen", "Soldalen 4, 7100 Vejle", "washhall", 55.681238105582004, 9.567455649375916, "7-22", 2, 0),
    ("tonder-centerbuen", "Tønder - Centerbuen", "Centerbuen 5, 6270 Tønder", "washhall", 54.95150464239765, 8.887799978256226, "7-22", 1, 0),
    ("tilst-blomstervej", "Tilst - Blomstervej", "Blomstervej 2T, 8381 Tilst", "washhall", 56.181787, 10.125, "7-22", 2, 0),
    ("thisted-osterbakken", "Thisted - Østerbakken", "Østerbakken 111, 7700 Thisted", "both", 56.968852, 8.735134, "7-22", 1, 2),
    ("taastrup-roskildevej", "Taastrup - Roskildevej", "Roskildevej 376, 2630 Taastrup", "washhall", 55.6580371, 12.2947118, "7-22", 3, 0),
    ("sonderborg-centerpassagen", "Sønderborg - Centerpassagen", "Centerpassagen 4, 6400 Sønderborg", "washhall", 54.91943029999999, 9.80803400000002, "7-22", 3, 0),
    ("soborg-dynamovej", "Søborg - Dynamovej", "Dynamovej 4, 2860 Søborg", "both", 55.73373131910534, 12.459960579872131, "7-22", 4, 3),
    ("svendborg-odensevej", "Svendborg - Odensevej", "Odensevej 94, 5700 Svendborg", "washhall", 55.07294981427255, 10.582398176193237, "7-22", 2, 0),
    ("svendborg-nyborgvej", "Svendborg - Nyborgvej", "Nyborgvej 4, 5700 Svendborg", "washhall", 55.06289309338622, 10.618591904640198, "7-22", 2, 0),
    ("struer-bredgade", "Struer - Bredgade", "Bredgade 58, 7600 Struer", "washhall", 56.48043486486458, 8.58553517739368, "7-22", 1, 0),
    ("soro-apotekervej", "Sorø - Apotekervej", "Apotekervej 14, 4180 Sorø", "washhall", 55.44513682000782, 11.563255190849304, "7-22", 2, 0),
    ("slagelse-smedegade", "Slagelse - Smedegade", "Smedegade 77, 4200 Slagelse", "washhall", 55.407685070822424, 11.36784553527832, "7-22", 2, 0),
    ("slagelse-idagardsvej", "Slagelse - Idagårdsvej", "Idagårdsvej 2, 4200 Slagelse", "washhall", 55.39173530633495, 11.353002190589905, "7-22", 2, 0),
    ("skive-oster-faelled-vej", "Skive - Øster Fælled vej", "Øster Fælled vej 4, 7800 Skive", "washhall", 56.5615666, 9.0395673, "7-22", 2, 0),
    ("silkeborg-nordre-ringvej", "Silkeborg - Nordre Ringvej", "Nordre Ringvej 90, 8600 Silkeborg", "washhall", 56.18141297417625, 9.536954224330657, "7-22", 2, 0),
    ("roskilde-ringstedvej", "Roskilde - Ringstedvej", "Ringstedvej 73, 4000 Roskilde", "washhall", 55.62842689768946, 12.066559455701054, "7-22", 2, 0),
    ("roskilde-byleddet", "Roskilde - Byleddet", "Byleddet 2, 4000 Roskilde", "washhall", 55.64370949464964, 12.109114229679108, "7-22", 2, 0),
    ("risskov-ravnsovej", "Risskov - Ravnsøvej", "Ravnsøvej 48B, 8240 Risskov", "washhall", 56.202062, 10.24449, "7-22", 2, 0),
    ("ringsted-norregade", "Ringsted - Nørregade", "Nørregade 70, 4100 Ringsted", "washhall", 55.45139205714039, 11.790081560611725, "7-22", 2, 0),
    ("ringsted-frejasvej", "Ringsted - Frejasvej", "Frejasvej 43, 4100 Ringsted", "washhall", 55.43066930735536, 11.801419258117676, "7-22", 2, 0),
    ("ribe-trojels-knae", "Ribe - Trojels Knæ", "Trojels Knæ 6, 6760 Ribe", "both", 55.351485, 8.780311, "7-22", 1, 2),
    ("randers-udbyhojvej", "Randers - Udbyhøjvej", "Udbyhøjvej 7, 8930 Randers", "washhall", 56.46604681568229, 10.05424976348877, "7-22", 2, 0),
    ("randers-messingvej", "Randers - Messingvej", "Messingvej 10, 8940 Randers", "washhall", 56.43036172292578, 10.053815245628357, "7-22", 2, 0),
    ("odense-v-bystaevnevej", "Odense V - Bystævnevej", "Bystævnevej 5, 5200 Odense", "both", 55.39502570059316, 10.346524715423584, "7-22", 3, 2),
    ("odense-so-orbaekvej", "Odense SØ - Ørbækvej", "Ørbækvej 99, 5220 Odense SØ", "washhall", 55.379874, 10.433066, "7-22", 2, 0),
    ("odense-nyborgvej", "Odense - Nyborgvej", "Nyborgvej 343, 5220 Odense", "washhall", 55.3915296, 10.435819199999969, "7-22", 3, 0),
    ("norresundby-loftbrovej", "Nørresundby - Loftbrovej", "Loftbrovej 2, 9400 Nørresundby", "both", 57.0891424, 9.969241, "7-22", 2, 2),
    ("naestved-gl-holstedvej", "Næstved - Gl. Holstedvej", "Gammel Holstedvej 1, 4700 Næstved", "washhall", 55.2496811, 11.78203099999996, "7-22", 2, 0),
    ("naestved-erantisvej", "Næstved - Erantisvej", "Erantisvej 52, 4700 Næstved", "both", 55.2391725675618, 11.777976751327515, "7-22", 3, 1),
    ("nykobing-falster-guldborgsundcentret", "Nykøbing Falster - Guldborgsundcentret", "Guldborgsundcentret 32, 4800 Nykøbing Falster", "washhall", 54.75880136632285, 11.851437091827393, "7-22", 2, 0),
    ("nyborg-storebaeltsvej", "Nyborg - Storebæltsvej", "Storebæltsvej 7F, 5800 Nyborg", "washhall", 55.30849794548207, 10.809624195098877, "7-22", 2, 0),
    ("nakskov-lojtoftevej", "Nakskov - Løjtoftevej", "Løjtoftevej 6, 4900 Nakskov", "both", 54.832475, 11.149662, "7-22", 1, 2),
    ("middelfart-skovsvinget", "Middelfart - Skovsvinget", "Skovsvinget 27c, 5500 Middelfart", "washhall", 55.51201276139861, 9.766180515289307, "7-22", 2, 0),
    ("lystrup-laegardsvej", "Lystrup - Lægårdsvej", "Lægårdsvej 4, 8520 Lystrup", "washhall", 56.225669, 10.238525, "7-22", 2, 0),
    ("koge-kobenhavnsvej", "Køge - Københavnsvej", "Københavnsvej 86, 4600 Køge", "washhall", 55.471805, 12.181953, "7-22", 2, 0),
    ("kolding-vejlevej-251", "Kolding - Vejlevej 251", "Vejlevej 251, 6000 Kolding", "both", 55.5136635, 9.4546968, "7-22", 3, 2),
    ("kolding-vejlevej-132", "Kolding - Vejlevej 132", "Vejlevej 132, 6000 Kolding", "washhall", 55.5040386, 9.4582265, "7-22", 2, 0),
    ("kalundborg-holbaekvej", "Kalundborg - Holbækvej", "Holbækvej 74, 4400 Kalundborg", "both", 55.678767, 11.13583, "7-22", 2, 1),
    ("ishoj-vejleavej", "Ishøj - Vejleåvej", "Vejleåvej 19, 2635 Ishøj", "both", 55.62338454215139, 12.321166813346327, "7-22", 2, 2),
    ("ikast-europavej", "Ikast - Europavej", "Europavej 3, 7430 Ikast", "both", 56.1236985, 9.1754224, "7-22", 1, 2),
    ("hojbjerg-bjodstrupvej", "Højbjerg - Bjødstrupvej", "Bjødstrupvej 20E, 8270 Højbjerg", "washhall", 56.107525, 10.166967, "7-22", 2, 0),
    ("horsens-vejlevej", "Horsens - Vejlevej", "Vejlevej 102, 8700 Horsens", "both", 55.833085, 9.804744, "7-22", 2, 2),
    ("holstebro-nybo-bakke", "Holstebro - Nybo Bakke", "Nybo Bakke 2, 7500 Holstebro", "washhall", 56.341889, 8.635395, "7-22", 2, 0),
    ("holbaek-springstrup", "Holbæk - Springstrup", "Springstrup 5, 4300 Holbæk", "both", 55.70302615069463, 11.666091084480286, "7-22", 3, 2),
    ("hjorring-sprogovej", "Hjørring - Sprogøvej", "Sprogøvej 2, 9800 Hjørring", "washhall", 57.455593834918346, 10.039465427398682, "7-22", 2, 0),
    ("hillerod-industrivaenget", "Hillerød - Industrivænget", "Industrivænget 3, 3400 Hillerød", "both", 55.931481, 12.282996, "7-22", 2, 2),
    ("herning-guldborgvej", "Herning - Guldborgvej", "Guldborgvej 2-4, 7400 Herning", "both", 56.1535542, 8.9847445, "7-22", 2, 1),
    ("herning-daemningen", "Herning - Dæmningen", "Dæmningen 21, 7400 Herning", "washhall", 56.132141, 8.95935, "7-22", 2, 0),
    ("herlev-norrelundvej", "Herlev - Nørrelundvej", "Nørrelundvej 2, 2730 Herlev", "both", 55.725365, 12.416697, "7-22", 2, 2),
    ("helsingor-klostermosevej", "Helsingør - Klostermosevej", "Klostermosevej 103, 3000 Helsingør", "both", 56.024018, 12.571863, "7-22", 2, 2),
    ("haderslev-sverigesvej", "Haderslev - Sverigesvej", "Sverigesvej 2M, 6100 Haderslev", "both", 55.2592112, 9.4741292, "7-22", 2, 2),
    ("grena-hesselvang", "Grenå - Hesselvang", "Hesselvang 1, 8500 Grenå", "both", 56.3838951, 10.8644506, "7-22", 1, 2),
    ("frederiksvaerk-hanehovedvej", "Frederiksværk - Hanehovedvej", "Hanehovedvej 49, 3300 Frederiksværk", "washhall", 55.9775589, 12.007447100000036, "7-22", 2, 0),
    ("frederikssund-askelundsvej", "Frederikssund - Askelundsvej", "Askelundsvej 8, 3600 Frederikssund", "washhall", 55.84515080248969, 12.074291110038757, "7-22", 2, 0),
    ("frederikshavn-apholmenvej", "Frederikshavn - Apholmenvej", "Apholmenvej 9, 9900 Frederikshavn", "both", 57.46219325161582, 10.519448227310988, "7-22", 2, 2),
    ("fredericia-vejlevej", "Fredericia - Vejlevej", "Vejlevej 20, 7000 Fredericia", "washhall", 55.5696911, 9.7276223, "7-22", 2, 0),
    ("fredericia-strevelinsvej", "Fredericia - Strevelinsvej", "Strevelinsvej 5, 7000 Fredericia", "washhall", 55.535519125891085, 9.718700051307678, "7-22", 3, 0),
    ("farum-gammelgardsvej", "Farum - Gammelgårdsvej", "Gammelgårdsvej 84, 3520 Farum", "both", 55.816943, 12.37035, "7-22", 3, 3),
    ("esbjerg-saedding-ringvej", "Esbjerg - Sædding Ringvej", "Sædding Ringvej 6, 6710 Esbjerg", "washhall", 55.5037278, 8.40741920000005, "7-22", 2, 0),
    ("ebeltoft-faergevejen", "Ebeltoft - Færgevejen", "Færgevejen 3, 8400 Ebeltoft", "washhall", 56.1908092, 10.672123100000022, "7-22", 1, 0),
    ("brondby-strand-gl-koge-landevej", "Brøndby Strand - Gl. Køge Landevej", "Gammel Køge Landevej 690, 2660 Brøndby Strand", "both", 55.618231, 12.42395, "7-22", 2, 2),
    ("brande-vestergardsvej", "Brande - Vestergårdsvej", "Vestergårdsvej 3, 7330 Brande", "washhall", 55.960647, 9.103426, "7-22", 1, 0),
    ("ballerup-industriparken", "Ballerup - Industriparken", "Industriparken 6, 2750 Ballerup", "both", 55.728714, 12.373295, "7-22", 2, 2),
    ("aalborg-gug-gammel-vissevej", "Aalborg, Gug - Gammel Vissevej", "Gammel Vissevej 1C, 9210 Aalborg - Gug", "washhall", 57.00631387314069, 9.925946295261383, "7-22", 2, 0),
    ("aalborg-otto-monstedsvej", "Aalborg - Otto Mønstedsvej", "Otto Mønsteds Vej 5, 9200 Aalborg", "washhall", 57.015248, 9.896256, "7-22", 2, 0),
    ("aabenraa-egevej", "Aabenraa - Egevej", "Egevej 4, 6200 Aabenraa", "both", 55.0656429, 9.3644501, "7-22", 1, 1),
]


def location_records():
    for index, location in enumerate(WASHWORLD_LOCATIONS):
        slug, name, address, location_type, latitude, longitude, opening_hours, halls_count, self_wash_count = location
        _, postal_city = address.rsplit(",", 1)
        postal_code, city = postal_city.strip().split(" ", 1)
        yield {
            "slug": slug,
            "name": name,
            "address": address,
            "postal_code": postal_code,
            "city": city,
            "location_type": location_type,
            "latitude": latitude,
            "longitude": longitude,
            "opening_hours": opening_hours,
            "halls_count": halls_count,
            "self_wash_count": self_wash_count,
            "image": ("/location-tilst.webp", "/location-viby.webp", "/location-hojbjerg.webp")[index % 3],
            "source_url": f"{SOURCE_URL}/{slug}",
        }
