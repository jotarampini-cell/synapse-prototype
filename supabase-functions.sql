-- Función para búsqueda semántica de contenidos
CREATE OR REPLACE FUNCTION match_contents(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    contents.id,
    1 - (contents.embedding <=> query_embedding) AS similarity
  FROM contents
  WHERE contents.user_id = match_contents.user_id
    AND contents.embedding IS NOT NULL
    AND 1 - (contents.embedding <=> query_embedding) > match_threshold
  ORDER BY contents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Función para obtener estadísticas del usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_id uuid)
RETURNS TABLE (
  total_contents bigint,
  total_connections bigint,
  total_nodes bigint,
  recent_growth bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM contents WHERE contents.user_id = get_user_stats.user_id) as total_contents,
    (SELECT COUNT(*) FROM connections WHERE connections.user_id = get_user_stats.user_id) as total_connections,
    (SELECT COUNT(*) FROM graph_nodes WHERE graph_nodes.user_id = get_user_stats.user_id) as total_nodes,
    (SELECT COUNT(*) FROM contents WHERE contents.user_id = get_user_stats.user_id AND contents.created_at > NOW() - INTERVAL '7 days') as recent_growth;
END;
$$;

-- Función para obtener nodos del grafo con sus conexiones
CREATE OR REPLACE FUNCTION get_graph_data(user_id uuid)
RETURNS TABLE (
  nodes jsonb,
  edges jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
  nodes_result jsonb;
  edges_result jsonb;
BEGIN
  -- Obtener nodos
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'label', label,
      'type', type,
      'color', color,
      'position', position,
      'metadata', metadata
    )
  ) INTO nodes_result
  FROM graph_nodes
  WHERE graph_nodes.user_id = get_graph_data.user_id;

  -- Obtener aristas (conexiones)
  SELECT jsonb_agg(
    jsonb_build_object(
      'source', source_concept,
      'target', target_concept,
      'strength', strength,
      'reason', reason
    )
  ) INTO edges_result
  FROM connections
  WHERE connections.user_id = get_graph_data.user_id;

  RETURN QUERY SELECT nodes_result, edges_result;
END;
$$;













