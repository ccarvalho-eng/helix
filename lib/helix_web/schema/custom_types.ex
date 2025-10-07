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
    Enum.reduce_while(fields, {:ok, %{}}, fn %{name: name, input_value: iv}, {:ok, acc} ->
      case decode_input_value(iv) do
        {:ok, value} -> {:cont, {:ok, Map.put(acc, name, value)}}
        :error -> {:halt, :error}
      end
    end)
  end

  defp decode(%Absinthe.Blueprint.Input.Null{}) do
    {:ok, nil}
  end

  defp decode(_), do: :error

  # Recursively decode Absinthe input values into Elixir terms
  @spec decode_input_value(term()) :: {:ok, term()} | :error
  defp decode_input_value(%Absinthe.Blueprint.Input.Object{fields: fields}) do
    Enum.reduce_while(fields, {:ok, %{}}, fn %{name: name, input_value: iv}, {:ok, acc} ->
      case decode_input_value(iv) do
        {:ok, value} -> {:cont, {:ok, Map.put(acc, name, value)}}
        :error -> {:halt, :error}
      end
    end)
  end

  defp decode_input_value(%Absinthe.Blueprint.Input.List{items: items}) do
    items
    |> Enum.reduce_while({:ok, []}, fn iv, {:ok, acc} ->
      case decode_input_value(iv) do
        {:ok, value} -> {:cont, {:ok, [value | acc]}}
        :error -> {:halt, :error}
      end
    end)
    |> case do
      {:ok, acc} -> {:ok, Enum.reverse(acc)}
      :error -> :error
    end
  end

  defp decode_input_value(%Absinthe.Blueprint.Input.String{value: value}), do: {:ok, value}
  defp decode_input_value(%Absinthe.Blueprint.Input.Integer{value: value}), do: {:ok, value}
  defp decode_input_value(%Absinthe.Blueprint.Input.Float{value: value}), do: {:ok, value}
  defp decode_input_value(%Absinthe.Blueprint.Input.Boolean{value: value}), do: {:ok, value}
  defp decode_input_value(%Absinthe.Blueprint.Input.Null{}), do: {:ok, nil}
  defp decode_input_value(_), do: :error
end
