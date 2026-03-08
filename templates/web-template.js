window.WEB_TEMPLATE = `| tstats \`summariesonly\` c as count min(_time) as first_seen, max(_time) as last_seen, values(Web.user), values(Web.uri_path), values(Web.http_method), values(Web.action), values(Web.status), values(Web.uri) values(Web.http_referrer) values(Web.http_user_agent) from datamodel=Web where nodename=Web {{TIME_RANGE}} Web.url IN ({{IOC_LIST}}) by Web.url Web.src Web.dest
| rename values(Web.*) as *, Web.* as *
| eval last_seen = strftime (last_seen, "%b %d, %H:%M %p")
| eval first_seen = strftime (first_seen, "%b %d, %H:%M %p")`;
