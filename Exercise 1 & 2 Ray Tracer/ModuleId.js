
// DO NOT CHANGE ANYTHING HERE
// This function read the variables given in the URL as GET parameters
// For example if you call raytracer.html?C1 then ModuleId.C1 equals true
// You can have several module by doing for example raytracer.html?C1&C2

var ModuleId = {
	B1: false, //... specular reflection/refraction and recursive ray tracing
	B2: false, //... anti-aliasing
	B3: false, //... quadrics
	B4: false, //... stereo
	C1: false, //... CSG primitives
	C2: false, //... texture mapping
	C3: false, //... meshes
	D1: false, //... octree
	D2: false,  //... area light
	Bonus1: false,	//... Bonus: depth field
	Bonus2: false,	//... Bonus: area light
	Bonus3: false,	//... Bonus: ambient occlusion
	China: false	//... Special mode for china
};

if(document.location.toString().indexOf('?') != -1) {
    var query = document.location.toString().replace(/^.*?\?/,'').split('&');

    for(var i=0 ; i < query.length ; i++) {
		switch(query[i]) {
			case "B1": ModuleId.B1 = true; break;
			case "B2": ModuleId.B2 = true; break;
			case "B3": ModuleId.B3 = true; break;
			case "B4": ModuleId.B4 = true; break;
			case "C1": ModuleId.C1 = true; break;
			case "C2": ModuleId.C2 = true; break;
			case "C3": ModuleId.C3 = true; break;
			case "D1": ModuleId.D1 = true; break;
			case "D2": ModuleId.D2 = true; break;
			case "Bonus1": ModuleId.Bonus1 = true; break;
			case 'Bonus2': ModuleId.Bonus2 = true; break;
			case 'Bonus3': ModuleId.Bonus3 = true; break;
			case "China": ModuleId.China = true; break;
		}
    }
}
