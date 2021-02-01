function queryNGrams(corpus,query,qng_length,qng_overlap){
	var outstring = "";	
	var qlength = query.length;
	
// query comes from the JSON files for each complete page converted from Aruspix MEI.
// NB This is is page-based, not piece-based (that requires metadata)
// query[0] is the image-name, query[2] is the page's end-time (for playback).
// There are thus problems with (a) incomplete pieces and (b) changes of piece within a page.
if(qlength == 3) {
	query = query[1];
	qlength = query.length;
}
	
	if(qng_overlap >= qng_length) {
		console.log("Sorry! Ngram overlap cannot be more than length!!")
	}
	else if(qlength < qng_length * 2) {
		console.log("Ooops! Query (length "+qlength+") is not long enough to extract ngrams of length "+qng_length);
//		console.log("	Query: "+query);
	}
	else {
		console.log("	Corpus: "+corpus);
//		console.log("	Query: "+JSON.stringify(query));
		console.log("	NGram-length: "+qng_length);
		console.log("	NGram-overlap: "+qng_overlap);

		var queries = new Array();
		for(var i=0;i<qlength-qng_length;i+=qng_length-qng_overlap) {
			ng_query = new Array();
			start = query[i][0];
			for(var k=i;k<(i+qng_length);k++){
				ng_query.push([query[k][0]-start,query[k][1]]);
			}
		
/*			var ng_query = query.slice(i,i+qng_length);
			var start = ng_query[0][0];
			var rev_query = ng_query;
	//		console.log("Start: "+start);
			for(j=0;j<ng_query.length;j++) {
	//			console.log(ng_query[j][0]+" - "+start);
			//	ng_query[j][0] -= start;
				rev_query[j][0] = ng_query[j][0] - start;
	//			console.log("\t"+j+" Now "+rev_query[j][0]);
*/
			queries.push(ng_query);
		}
	}
	return queries;
}