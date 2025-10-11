export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string
					email: string | null
					full_name: string | null
					interests: string[] | null
					created_at: string
					updated_at: string
				}
				Insert: {
					id: string
					email?: string | null
					full_name?: string | null
					interests?: string[] | null
					created_at?: string
					updated_at?: string
				}
				Update: {
					id?: string
					email?: string | null
					full_name?: string | null
					interests?: string[] | null
					created_at?: string
					updated_at?: string
				}
				Relationships: [
					{
						foreignKeyName: "profiles_id_fkey"
						columns: ["id"]
						referencedRelation: "users"
						referencedColumns: ["id"]
					}
				]
			}
			contents: {
				Row: {
					id: string
					user_id: string
					title: string
					content: string
					content_type: string
					tags: string[] | null
					created_at: string
					updated_at: string
					embedding: number[] | null
					file_url: string | null
				}
				Insert: {
					id?: string
					user_id: string
					title: string
					content: string
					content_type: string
					tags?: string[] | null
					created_at?: string
					updated_at?: string
					embedding?: number[] | null
					file_url?: string | null
				}
				Update: {
					id?: string
					user_id?: string
					title?: string
					content?: string
					content_type?: string
					tags?: string[] | null
					created_at?: string
					updated_at?: string
					embedding?: number[] | null
					file_url?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "contents_user_id_fkey"
						columns: ["user_id"]
						referencedRelation: "profiles"
						referencedColumns: ["id"]
					}
				]
			}
			summaries: {
				Row: {
					id: string
					content_id: string
					summary: string
					key_concepts: string[] | null
					created_at: string
				}
				Insert: {
					id?: string
					content_id: string
					summary: string
					key_concepts?: string[] | null
					created_at?: string
				}
				Update: {
					id?: string
					content_id?: string
					summary?: string
					key_concepts?: string[] | null
					created_at?: string
				}
				Relationships: [
					{
						foreignKeyName: "summaries_content_id_fkey"
						columns: ["content_id"]
						referencedRelation: "contents"
						referencedColumns: ["id"]
					}
				]
			}
			connections: {
				Row: {
					id: string
					user_id: string
					source_concept: string
					target_concept: string
					strength: number
					reason: string | null
					created_at: string
				}
				Insert: {
					id?: string
					user_id: string
					source_concept: string
					target_concept: string
					strength: number
					reason?: string | null
					created_at?: string
				}
				Update: {
					id?: string
					user_id?: string
					source_concept?: string
					target_concept?: string
					strength?: number
					reason?: string | null
					created_at?: string
				}
				Relationships: [
					{
						foreignKeyName: "connections_user_id_fkey"
						columns: ["user_id"]
						referencedRelation: "profiles"
						referencedColumns: ["id"]
					}
				]
			}
			graph_nodes: {
				Row: {
					id: string
					user_id: string
					label: string
					type: string
					color: string
					position: Json | null
					metadata: Json | null
					created_at: string
				}
				Insert: {
					id?: string
					user_id: string
					label: string
					type: string
					color: string
					position?: Json | null
					metadata?: Json | null
					created_at?: string
				}
				Update: {
					id?: string
					user_id?: string
					label?: string
					type?: string
					color?: string
					position?: Json | null
					metadata?: Json | null
					created_at?: string
				}
				Relationships: [
					{
						foreignKeyName: "graph_nodes_user_id_fkey"
						columns: ["user_id"]
						referencedRelation: "profiles"
						referencedColumns: ["id"]
					}
				]
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}


