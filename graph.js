const ql = require('graphql');

module.exports = new function () {
	this.ql = ql;
	let rawTypes = {};

	let createType = (name, obj) => {
		if (rawTypes[name]) throw new Error(`Type '${name}' already exists.`);
		return rawTypes[name] = {
			from: obj.from || ql.GraphQLObjectType,
			name: obj.name,
			description: obj.description,
			args: obj.args,
			fields: [obj.fields],
			extend: fields => rawTypes[name].fields.push(fields instanceof Function ? fields : () => fields)
		};
	};

	this.type = (name, obj) => {
		if (obj === undefined) {
			if (rawTypes[name] === undefined) throw new Error(`Type '${name}' does not exist.`);
			return rawTypes[name];
		}
		return createType(name, obj);
	};

	createType('query', {
		name: 'Query',
		fields: () => ({
			test: { type: ql.GraphQLString, resolve: () => 'works.' }
		})
	});
	
	createType('mutation', {
		name: 'Mutation',
		fields: () => ({
			hello: { type: ql.GraphQLString, resolve: () => 'world.' }
		})
	});

	let fnFromArray = fns => () => fns.reduce((obj, fn) => Object.assign({}, obj, fn.call()), {});

	this.generate = () => {
		
		for (let key in rawTypes) {
			let item = rawTypes[key];
			rawTypes[key] = new item.from({
				name: item.name,
				description: item.description,
				args: item.args,
				fields: fnFromArray(item.fields),
			});
		}
		let schema = new ql.GraphQLSchema({ query: this.type('query'), mutation: this.type('mutation') });

		return schema;
	}

}