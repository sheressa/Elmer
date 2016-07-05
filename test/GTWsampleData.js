//sample data for testing jobs/scheduling/AttendanceSync.js
var userArr = [
	{
		"firstName": "Medge",
		"lastName": "Hood",
		"attendanceTimeInSeconds": 6529,
		"email": "non.ante.bibendum@euismod.edu"
	},
	{
		"firstName": "Barrett",
		"lastName": "Boone",
		"attendanceTimeInSeconds": 2074,
		"email": "egestas@egetipsum.co.uk"
	},
	{
		"firstName": "Zephr",
		"lastName": "Robbins",
		"attendanceTimeInSeconds": 788,
		"email": "orci.Donec.nibh@dictumPhasellusin.ca"
	},
	{
		"firstName": "Zephr",
		"lastName": "Robbins",
		"attendanceTimeInSeconds": 788,
		"email": "orci.Donec.nibh@dictumPhasellusin.ca"
	},
	{
		"firstName": "Zephr",
		"lastName": "Robbins",
		"attendanceTimeInSeconds": 5,
		"email": "orci.Donec.nibh@dictumPhasellusin.ca"
	},
	{
		"firstName": "Zephr",
		"lastName": "Robbins",
		"attendanceTimeInSeconds": 70,
		"email": "orci.Donec.nibh@dictumPhasellusin.ca"
	},
	{
		"firstName": "Lionel",
		"lastName": "Goodman",
		"attendanceTimeInSeconds": 1331,
		"email": "quis.massa.Mauris@perconubianostra.edu"
	},
	{
		"firstName": "Juliet",
		"lastName": "Clayton",
		"attendanceTimeInSeconds": 1236,
		"email": "tempor.lorem.eget@montesnascetur.co.uk"
	},
	{
		"firstName": "Blaze",
		"lastName": "Goodman",
		"attendanceTimeInSeconds": 301,
		"email": "mi@temporestac.org"
	},
	{
		"firstName": "Robin",
		"lastName": "Cooley",
		"attendanceTimeInSeconds": 2685,
		"email": "neque.tellus@semperegestasurna.co.uk"
	},
	{
		"firstName": "Gavin",
		"lastName": "Ewing",
		"attendanceTimeInSeconds": 2586,
		"email": "interdum.enim@volutpat.org"
	},
	{
		"firstName": "Beck",
		"lastName": "Ross",
		"attendanceTimeInSeconds": 794,
		"email": "malesuada.vel.venenatis@orciluctuset.org"
	},
	{
		"firstName": "Beck",
		"lastName": "Ross",
		"attendanceTimeInSeconds": 794,
		"email": "malesuada.vel.venenatis@orciluctuset.org"
	},
	{
		"firstName": "Aimee",
		"lastName": "Reese",
		"attendanceTimeInSeconds": 322,
		"email": "Nulla.tincidunt.neque@etmalesuadafames.edu"
	},
	{
		"firstName": "Griffin",
		"lastName": "Perez",
		"attendanceTimeInSeconds": 2371,
		"email": "nunc.interdum.feugiat@sagittis.co.uk"
	},
	{
		"firstName": "Aline",
		"lastName": "Cantu",
		"attendanceTimeInSeconds": 2474,
		"email": "gravida.Praesent@Suspendisse.net"
	},
	{
		"firstName": "Ebony",
		"lastName": "Frazier",
		"attendanceTimeInSeconds": 2721,
		"email": "justo@nisiAeneaneget.co.uk"
	},
	{
		"firstName": "Ebony",
		"lastName": "Frazier",
		"attendanceTimeInSeconds": 2721,
		"email": "justo@nisiAeneaneget.co.uk"
	},
	{
		"firstName": "Ebony",
		"lastName": "Frazier",
		"attendanceTimeInSeconds": 2721,
		"email": "justo@nisiAeneaneget.co.uk"
	},
	{
		"firstName": "Ebony",
		"lastName": "Frazier",
		"attendanceTimeInSeconds": 2721,
		"email": "justo@nisiAeneaneget.co.uk"
	},
	{
		"firstName": "Alika",
		"lastName": "Jimenez",
		"attendanceTimeInSeconds": 1745,
		"email": "enim@Nullamscelerisqueneque.co.uk"
	},
	{
		"firstName": "Joy",
		"lastName": "Bryan",
		"attendanceTimeInSeconds": 1177,
		"email": "nunc.sed.pede@lacusUt.edu"
	},
	{
		"firstName": "Forrest",
		"lastName": "Beach",
		"attendanceTimeInSeconds": 2412,
		"email": "tempor.erat.neque@sollicitudin.com"
	},
	{
		"firstName": "Shannon",
		"lastName": "Lee",
		"attendanceTimeInSeconds": 2304,
		"email": "leo@Maecenas.com"
	},
	{
		"firstName": "Malcolm",
		"lastName": "Fuller",
		"attendanceTimeInSeconds": 401,
		"email": "malesuada.Integer@natoquepenatibus.net"
	},
	{
		"firstName": "Chiquita",
		"lastName": "Richmond",
		"attendanceTimeInSeconds": 911,
		"email": "lacus@vel.org"
	},
	{
		"firstName": "Whitney",
		"lastName": "Rivera",
		"attendanceTimeInSeconds": 2898,
		"email": "netus.et@loremloremluctus.org"
	},
	{
		"firstName": "Beau",
		"lastName": "Barnes",
		"attendanceTimeInSeconds": 687,
		"email": "eget@temporaugueac.edu"
	},
	{
		"firstName": "Kelly",
		"lastName": "Hardy",
		"attendanceTimeInSeconds": 551,
		"email": "fringilla.est.Mauris@Fusce.ca"
	},
	{
		"firstName": "Garrett",
		"lastName": "Chen",
		"attendanceTimeInSeconds": 2183,
		"email": "ante@facilisisnonbibendum.ca"
	},
	{
		"firstName": "Sydney",
		"lastName": "Haley",
		"attendanceTimeInSeconds": 2248,
		"email": "euismod.et@sagittisaugueeu.edu"
	},
	{
		"firstName": "Lenore",
		"lastName": "Holman",
		"attendanceTimeInSeconds": 2210,
		"email": "egestas@molestiedapibus.edu"
	},
	{
		"firstName": "Madeline",
		"lastName": "Carney",
		"attendanceTimeInSeconds": 2778,
		"email": "dolor.nonummy.ac@Nuncquisarcu.net"
	},
	{
		"firstName": "Kenyon",
		"lastName": "Wade",
		"attendanceTimeInSeconds": 1947,
		"email": "vestibulum.massa@urna.co.uk"
	},
	{
		"firstName": "Cyrus",
		"lastName": "Orr",
		"attendanceTimeInSeconds": 2358,
		"email": "magna@MorbimetusVivamus.co.uk"
	},
	{
		"firstName": "Cora",
		"lastName": "Harper",
		"attendanceTimeInSeconds": 1223,
		"email": "fringilla@elit.ca"
	},
	{
		"firstName": "Nita",
		"lastName": "Mooney",
		"attendanceTimeInSeconds": 730,
		"email": "pede.Cum@Aliquam.co.uk"
	},
	{
		"firstName": "Clare",
		"lastName": "Mcdowell",
		"attendanceTimeInSeconds": 1246,
		"email": "ultricies.adipiscing@quis.co.uk"
	},
	{
		"firstName": "Malik",
		"lastName": "Alvarado",
		"attendanceTimeInSeconds": 865,
		"email": "viverra.Maecenas.iaculis@consequat.net"
	},
	{
		"firstName": "Desirae",
		"lastName": "Ramos",
		"attendanceTimeInSeconds": 2256,
		"email": "montes.nascetur.ridiculus@nibh.co.uk"
	},
	{
		"firstName": "Alfonso",
		"lastName": "Huff",
		"attendanceTimeInSeconds": 2143,
		"email": "Nam.ligula@Donecegestas.ca"
	},
	{
		"firstName": "Ila",
		"lastName": "Allen",
		"attendanceTimeInSeconds": 1186,
		"email": "semper@nasceturridiculusmus.edu"
	},
	{
		"firstName": "Gisela",
		"lastName": "Powell",
		"attendanceTimeInSeconds": 2975,
		"email": "cursus.diam@vitaeposuereat.net"
	},
	{
		"firstName": "Fuller",
		"lastName": "Solomon",
		"attendanceTimeInSeconds": 1616,
		"email": "ipsum@Phasellus.edu"
	},
	{
		"firstName": "Lucas",
		"lastName": "Preston",
		"attendanceTimeInSeconds": 2905,
		"email": "neque.Morbi.quis@In.net"
	},
	{
		"firstName": "Anjolie",
		"lastName": "House",
		"attendanceTimeInSeconds": 2460,
		"email": "eget.odio@Praesentluctus.ca"
	},
	{
		"firstName": "Anjolie",
		"lastName": "House",
		"attendanceTimeInSeconds": 460,
		"email": "eget.odio@Praesentluctus.ca"
	},
	{
		"firstName": "Anjolie",
		"lastName": "House",
		"attendanceTimeInSeconds": 4460,
		"email": "eget.odio@Praesentluctus.ca"
	},
	{
		"firstName": "Ferris",
		"lastName": "Clark",
		"attendanceTimeInSeconds": 1379,
		"email": "Ut.semper.pretium@dolor.org"
	},
	{
		"firstName": "Francesca",
		"lastName": "Mccarty",
		"attendanceTimeInSeconds": 2720,
		"email": "facilisis@eu.co.uk"
	},
	{
		"firstName": "Fredericka",
		"lastName": "David",
		"attendanceTimeInSeconds": 1560,
		"email": "dignissim.lacus.Aliquam@Inat.edu"
	},
	{
		"firstName": "Kermit",
		"lastName": "Dale",
		"attendanceTimeInSeconds": 1973,
		"email": "nonummy.ut.molestie@placerataugueSed.org"
	},
	{
		"firstName": "Ebony",
		"lastName": "Wall",
		"attendanceTimeInSeconds": 300,
		"email": "quis.diam@Proinvelit.org"
	},
	{
		"firstName": "Ebony",
		"lastName": "Wall",
		"attendanceTimeInSeconds": 343,
		"email": "quis.diam@Proinvelit.org"
	},
	{
		"firstName": "Len",
		"lastName": "Finch",
		"attendanceTimeInSeconds": 2139,
		"email": "ullamcorper@nislNullaeu.net"
	},
	{
		"firstName": "Jamal",
		"lastName": "Brennan",
		"attendanceTimeInSeconds": 2368,
		"email": "euismod.enim.Etiam@eu.org"
	},
	{
		"firstName": "Jana",
		"lastName": "Mccoy",
		"attendanceTimeInSeconds": 1306,
		"email": "scelerisque@diamluctus.co.uk"
	},
	{
		"firstName": "Aurora",
		"lastName": "Montoya",
		"attendanceTimeInSeconds": 966,
		"email": "cursus.diam@loremacrisus.net"
	},
	{
		"firstName": "Noelle",
		"lastName": "Silva",
		"attendanceTimeInSeconds": 2778,
		"email": "dictum.augue@dolorFusce.ca"
	},
	{
		"firstName": "Imogene",
		"lastName": "Foster",
		"attendanceTimeInSeconds": 2781,
		"email": "elementum.dui@euduiCum.ca"
	},
	{
		"firstName": "Imogene",
		"lastName": "Foster",
		"attendanceTimeInSeconds": 2781,
		"email": "elementum.dui@euduiCum.ca"
	},
	{
		"firstName": "Imogene",
		"lastName": "Foster",
		"attendanceTimeInSeconds": 2781,
		"email": "elementum.dui@euduiCum.ca"
	},
	{
		"firstName": "Venus",
		"lastName": "Thompson",
		"attendanceTimeInSeconds": 2738,
		"email": "taciti.sociosqu@fringillaestMauris.edu"
	},
	{
		"firstName": "Kay",
		"lastName": "Castillo",
		"attendanceTimeInSeconds": 1843,
		"email": "lorem@mitemporlorem.ca"
	},
	{
		"firstName": "Karina",
		"lastName": "Petersen",
		"attendanceTimeInSeconds": 944,
		"email": "dapibus@hendrerit.net"
	},
	{
		"firstName": "Karina",
		"lastName": "Petersen",
		"attendanceTimeInSeconds": 44,
		"email": "dapibus@hendrerit.net"
	},
	{
		"firstName": "Karina",
		"lastName": "Petersen",
		"attendanceTimeInSeconds": 914,
		"email": "dapibus@hendrerit.net"
	},
	{
		"firstName": "Oscar",
		"lastName": "Irwin",
		"attendanceTimeInSeconds": 1811,
		"email": "sodales.nisi@consectetueripsum.net"
	},
	{
		"firstName": "Cynthia",
		"lastName": "Dickerson",
		"attendanceTimeInSeconds": 1759,
		"email": "orci@aliquetlibero.edu"
	},
	{
		"firstName": "Dante",
		"lastName": "Gamble",
		"attendanceTimeInSeconds": 382,
		"email": "libero.dui.nec@Nuncsollicitudincommodo.net"
	},
	{
		"firstName": "Elmo",
		"lastName": "Miller",
		"attendanceTimeInSeconds": 2849,
		"email": "dolor@justo.net"
	},
	{
		"firstName": "Jameson",
		"lastName": "Jensen",
		"attendanceTimeInSeconds": 2469,
		"email": "in.hendrerit@hendreritDonecporttitor.edu"
	},
	{
		"firstName": "Deacon",
		"lastName": "Pena",
		"attendanceTimeInSeconds": 2696,
		"email": "ultrices.mauris@magnisdis.com"
	},
	{
		"firstName": "Hannah",
		"lastName": "Bradford",
		"attendanceTimeInSeconds": 2202,
		"email": "interdum.Nunc.sollicitudin@Fuscemi.org"
	},
	{
		"firstName": "Sopoline",
		"lastName": "Golden",
		"attendanceTimeInSeconds": 2184,
		"email": "Praesent.interdum@Aliquam.org"
	},
	{
		"firstName": "Cynthia",
		"lastName": "Bright",
		"attendanceTimeInSeconds": 2739,
		"email": "Nullam@nonjustoProin.edu"
	},
	{
		"firstName": "Sage",
		"lastName": "Leonard",
		"attendanceTimeInSeconds": 1477,
		"email": "eu.nibh@SeddictumProin.org"
	},
	{
		"firstName": "Freya",
		"lastName": "Mercer",
		"attendanceTimeInSeconds": 1002,
		"email": "magnis.dis@enim.ca"
	},
	{
		"firstName": "Aristotle",
		"lastName": "Pate",
		"attendanceTimeInSeconds": 460,
		"email": "rutrum@nequesed.co.uk"
	},
	{
		"firstName": "Aristotle",
		"lastName": "Pate",
		"attendanceTimeInSeconds": 4460,
		"email": "rutrum@nequesed.co.uk"
	},
	{
		"firstName": "Aristotle",
		"lastName": "Pate",
		"attendanceTimeInSeconds": 460,
		"email": "rutrum@nequesed.co.uk"
	},
	{
		"firstName": "Aristotle",
		"lastName": "Pate",
		"attendanceTimeInSeconds": 460,
		"email": "rutrum@nequesed.co.uk"
	},
	{
		"firstName": "Avye",
		"lastName": "Johns",
		"attendanceTimeInSeconds": 1773,
		"email": "semper.tellus@mattisornarelectus.com"
	},
	{
		"firstName": "Yardley",
		"lastName": "Kline",
		"attendanceTimeInSeconds": 2526,
		"email": "Vivamus@egestashendreritneque.edu"
	},
	{
		"firstName": "Christen",
		"lastName": "Ball",
		"attendanceTimeInSeconds": 2953,
		"email": "eu.arcu.Morbi@aliquetmetus.co.uk"
	},
	{
		"firstName": "Courtney",
		"lastName": "Mays",
		"attendanceTimeInSeconds": 2603,
		"email": "ipsum.non.arcu@nonegestas.org"
	},
	{
		"firstName": "Hope",
		"lastName": "Sampson",
		"attendanceTimeInSeconds": 1952,
		"email": "consequat@Aenean.org"
	},
	{
		"firstName": "Rhiannon",
		"lastName": "Armstrong",
		"attendanceTimeInSeconds": 2117,
		"email": "diam@purussapiengravida.com"
	},
	{
		"firstName": "Katell",
		"lastName": "Foreman",
		"attendanceTimeInSeconds": 1328,
		"email": "ac.ipsum@velit.com"
	},
	{
		"firstName": "Mark",
		"lastName": "Norton",
		"attendanceTimeInSeconds": 5,
		"email": "ut.cursus.luctus@auctor.ca"
	},
	{
		"firstName": "Mark",
		"lastName": "Norton",
		"attendanceTimeInSeconds": 2201,
		"email": "ut.cursus.luctus@auctor.ca"
	},
	{
		"firstName": "Mark",
		"lastName": "Norton",
		"attendanceTimeInSeconds": 201,
		"email": "ut.cursus.luctus@auctor.ca"
	},
	{
		"firstName": "Mark",
		"lastName": "Norton",
		"attendanceTimeInSeconds": 50,
		"email": "ut.cursus.luctus@auctor.ca"
	},
	{
		"firstName": "Mark",
		"lastName": "Norton",
		"attendanceTimeInSeconds": 2201,
		"email": "ut.cursus.luctus@auctor.ca"
	},
	{
		"firstName": "Teegan",
		"lastName": "Buchanan",
		"attendanceTimeInSeconds": 5602,
		"email": "ipsum.sodales.purus@malesuadavelconvallis.com"
	}
];

var userRes = [ {
		"firstName": "Medge",
		"lastName": "Hood",
		"email": "non.ante.bibendum@euismod.edu",
		"attendance": 6529
	},
	{
		"firstName": "Ebony",
		"lastName": "Frazier",
		"email": "justo@nisiAeneaneget.co.uk",
		"attendance": 10884
	},
	{
		"firstName": "Anjolie",
		"lastName": "House",
		"email": "eget.odio@Praesentluctus.ca",
		"attendance": 7380
	},
	{
		"firstName": "Imogene",
		"lastName": "Foster",
		"email": "elementum.dui@euduiCum.ca",
		"attendance": 8343
	},
	{
		"firstName": "Aristotle",
		"lastName": "Pate",
		"email": "rutrum@nequesed.co.uk",
		"attendance": 5840
	},
	{
		"firstName": "Teegan",
		"lastName": "Buchanan",
		"email": "ipsum.sodales.purus@malesuadavelconvallis.com",
		"attendance": 5602
	}
];

module.exports = {userArr: userArr, 
	             userRes: userRes};