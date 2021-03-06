const moment = require('moment');

module.exports.DYNAMODB_TABLES = {
	"customers": process.env.DYNAMODB_CUSTOMERS_TABLE,
	"venues": process.env.DYNAMODB_VENUES_TABLE,
	"venueDailyTotals": process.env.DYNAMODB_VENUE_DAILY_TOTALS_TABLE,
	"customerDailyTotals": process.env.DYNAMODB_CUSTOMER_DAILY_TOTALS_TABLE,
	"visitors": process.env.DYNAMODB_VISITORS_TABLE,
	"visits": process.env.DYNAMODB_VISITS_TABLE
};

module.exports.SHARED_KEY = process.env.SHARED_KEY;

const now = new Date();

module.exports.MOMENTS = {
	now: moment(now),
	age13Birth: moment(now).add(-13, 'years'), 
	age18Birth: moment(now).add(-18, 'years'), 
	age25Birth: moment(now).add(-25, 'years'),
	age35Birth: moment(now).add(-35, 'years'),
	age45Birth: moment(now).add(-45, 'years'),
	age55Birth: moment(now).add(-55, 'years'),
	age65Birth: moment(now).add(-65, 'years')
};

module.exports.ELASTIC_URL = process.env.ELASTIC_URL;
module.exports.REGION = process.env.REGION;


module.exports.esDomain = {
    region: module.exports.REGION,
    endpoint: module.exports.ELASTIC_URL,
    index: 'call_logs',
    doctype: 'call_log',
    indexVisitor: 'visitors',
    doctypeVisitor: 'visitor',
    log: 'error',
    connectionClass: require('http-aws-es')
};
module.exports.DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];


module.exports.VISITOR_MAPPINGS = {
	"visitor": {
		"properties" : {
			"id" : {
				"type": "keyword",
				"index": true
            },
			"first_name" : {
				"type": "text",
				"index": true
            },
			"last_name" : {
				"type": "text",
				"index": true
            },
			"gender" : {
				"type": "keyword",
				"index": true
            },
			"date_of_birth" : {
				"type": "date",
				"index": true
            },
			"location" : {
				"type": "keyword",
				"index": true
            },
			"email" : {
				"type": "text",
				"index": true
            },
			"mobile" : {
				"type": "text",
				"index": true
            },
			"first_seen" : {
				"type": "date",
				"index": true
            },
			"last_seen" : {
				"type": "date",
				"index": true
            },
			"mac" : {
				"type": "keyword",
				"index": false
            },
			"visits" : {
				"type": "keyword",
				"index": true
            },
			"source" : {
				"type": "keyword",
				"index": true
            }
		}		
	}
};	

module.exports.CALL_LOG_MAPPINGS = {
	"call_log" : {
		"properties" : {
			"id" : {
				"type": "keyword",
				"index": true
            },
			"timestamp" : {
				"type" : "long"
			},
			"caller_id" : {
				"type": "text",
				"index": true
			},
			"called_number" : {
				"type": "text",
				"index": true
			},
			"start_time" : {
				"type" : "date"
			},
			"start_hour" : {
				"type" : "integer"
			},
			"start_day" : {
				"type" : "integer"
			},
			"start_time_epoch" : {
				"type" : "long"
			},
			"created_at" : {
				"type" : "date"
			},
			"created_at_epoch" : {
				"type" : "long"
			},
			"direction" : {
				"type": "keyword",
				"index": true
			},
			"type" : {
				"type": "keyword",
				"index": true				
			},
			"area_code" : {
				"type": "keyword",
				"index": true				
			},
			"localities" : {
				"type": "text",
				"index": true				
			},
			"area_code_display" : {
				"type": "keyword",
				"index": true				
			},
			"state" : {
				"type": "keyword",
				"index": true				
			},
			"country_code" : {
				"type": "keyword",
				"index": true				
			},
			"tz_offset" : {
				"type" : "integer"
			},
			"location" : {
				"type" : "geo_point"
			},
			"call_duration" : {
				"type" : "short"
			},
			"record_duration" : {
				"type" : "short"
			},
			"is_monitored" : {
				"type": "keyword",
				"index": true
			},
			"call_number" : {
				"type": "keyword",
				"index": true
			},
			"final_action" : {
				"type": "keyword",
				"index": true
			},
			"voicemail_url" : {
				"type": "keyword",
				"index": false
			},
			"voicemail_cp_url" : {
				"type": "keyword",
				"index": false
			},
			"voicemail_transcript" : {
				"type": "keyword",
				"index": false
			},
			"call_recording_url" : {
				"type": "keyword",
				"index": false
			},
			"call_recording_cp_url" : {
				"type": "keyword",
				"index": false
			},
			"called_nickname" : {
				"type": "text",
				"index": true
			},
			"caller_cnam" : {
				"type": "text",
				"index": true
			},
			"extension": {
                "type" : "object",
                "properties": {
                    "id" : {
                        "type" : "long"
                    },
                    "name" : {
						"type": "text",
						"index": true
					},
                    "extension" : {
                        "type" : "integer"
                    },
                    "voip_id" : {
                        "type" : "integer"
                    }
                }
            },
            "details" : {
                "type": "nested",
                "properties" : {
                    "called_number" : {
						"type": "keyword",
						"index": true
					},
                    "type_called_number" : {
						"type": "keyword",
						"index": true
					},
                    "caller_id" : {
						"type": "text",
						"index": true
					},
                    "start_time" : {
                        "type" : "long"
                    },
                    "start_time_ms" : {
                        "type" : "date"
                    },
                    "type" : {
						"type": "keyword",
						"index": true
					},
					"duration" : {
						"type" : "short"
					},		
					"voip_id" : {
                        "type" : "integer"
                    }
                }
            }            
		}
	}
};

module.exports.STATES = {
	"AL":"Alabama",
	"AK":"Alaska",
	"AZ":"Arizona",
	"AR":"Arkansas",
	"CA":"California",
	"CO":"Colorado",
	"CT":"Connecticut",
	"DE":"Delaware",
	"DC":"District of Columbia",
	"FL":"Florida",
	"GA":"Georgia",
	"HI":"Hawaii",
	"ID":"Idaho",
	"IL":"Illinois",
	"IN":"Indiana",
	"IA":"Iowa",
	"KS":"Kansas",
	"KY":"Kentucky",
	"LA":"Louisiana",
	"ME":"Maine",
	"MT":"Montana",
	"NE":"Nebraska",
	"NV":"Nevada",
	"NH":"New Hampshire",
	"NJ":"New Jersey",
	"NM":"New Mexico",
	"NY":"New York",
	"NC":"North Carolina",
	"ND":"North Dakota",
	"OH":"Ohio",
	"OK":"Oklahoma",
	"OR":"Oregon",
	"MD":"Maryland",
	"MA":"Massachusetts",
	"MI":"Michigan",
	"MN":"Minnesota",
	"MS":"Mississippi",
	"MO":"Missouri",
	"PA":"Pennsylvania",
	"RI":"Rhode Island",
	"SC":"South Carolina",
	"SD":"South Dakota",
	"TN":"Tennessee",
	"TX":"Texas",
	"UT":"Utah",
	"VT":"Vermont",
	"VA":"Virginia",
	"WA":"Washington",
	"WV":"West Virginia",
	"WI":"Wisconsin",
	"WY":"Wyoming"
};