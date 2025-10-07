defmodule HelixWeb.Schema.CustomTypes do
  @moduledoc """
  Custom scalar types for GraphQL schema.
  """

  use Absinthe.Schema.Notation

  @desc """
  The JSON scalar type represents arbitrary JSON data as a map.
  This is used for flexible configuration data in nodes and edges.
  """
  scalar :json do
    description("""
    The `Json` scalar type represents arbitrary JSON data.
    When returned, it's a map. When received as input, it can be a JSON string or map.
    """)

    serialize(&encode/1)
    parse(&decode/1)
  end

  # Encode: Convert Elixir term to JSON-serializable format
  # For maps, pass through as-is (Apollo/GraphQL clients handle JSON serialization)
  @spec encode(term()) :: term()
  defp encode(value), do: value

  # Decode: Handle input from GraphQL queries/mutations
  @spec decode(
          Absinthe.Blueprint.Input.String.t()
          | Absinthe.Blueprint.Input.Object.t()
          | Absinthe.Blueprint.Input.Null.t()
          | any()
        ) :: {:ok, term()} | :error
  defp decode(%Absinthe.Blueprint.Input.String{value: value}) do
    case Jason.decode(value) do
      {:ok, result} -> {:ok, result}
      _ -> :error
    end
  end

  defp decode(%Absinthe.Blueprint.Input.Object{fields: fields}) do
    result =
      fields
      |> Enum.map(fn %{name: name, input_value: %{data: value}} ->
        {name, value}
      end)
      |> Map.new()

    {:ok, result}
  end

  defp decode(%Absinthe.Blueprint.Input.Null{}) do
    {:ok, nil}
  end

  defp decode(_), do: :error
end
