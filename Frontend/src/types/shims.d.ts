declare module '@tanstack/react-query'
declare module 'graphql-ws'
declare module '@apollo/client' {
	export const ApolloProvider: any
	export const gql: any
	export const ApolloClient: any
	export const InMemoryCache: any
	export const HttpLink: any
	export default any
}
declare module '@apollo/client/react' {
	const x: any
	export default x
}
	declare function split(...args: any[]): any
	declare module '@apollo/client' {
		export { split }
	}
