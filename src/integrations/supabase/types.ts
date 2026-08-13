export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aulas: {
        Row: {
          autor_nome: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          disciplina: string | null
          id: string
          nivel: string | null
          publica: boolean
          slug: string
          texto_pt: string
          titulo: string
          updated_at: string
          visualizacoes: number
        }
        Insert: {
          autor_nome?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          disciplina?: string | null
          id?: string
          nivel?: string | null
          publica?: boolean
          slug: string
          texto_pt: string
          titulo: string
          updated_at?: string
          visualizacoes?: number
        }
        Update: {
          autor_nome?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          disciplina?: string | null
          id?: string
          nivel?: string | null
          publica?: boolean
          slug?: string
          texto_pt?: string
          titulo?: string
          updated_at?: string
          visualizacoes?: number
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      contribuicoes_sinais: {
        Row: {
          categoria_sugerida: string | null
          created_at: string
          descricao: string | null
          id: string
          palavra: string
          revisor_id: string | null
          status: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          categoria_sugerida?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          palavra: string
          revisor_id?: string | null
          status?: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          categoria_sugerida?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          palavra?: string
          revisor_id?: string | null
          status?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      correcoes_traducao: {
        Row: {
          aplicada: boolean
          contexto: Json
          created_at: string
          direcao: string
          entrada: string
          entrada_norm: string
          id: string
          saida_corrigida: string
          saida_original: string | null
          updated_at: string
          user_id: string | null
          votos: number
        }
        Insert: {
          aplicada?: boolean
          contexto?: Json
          created_at?: string
          direcao: string
          entrada: string
          entrada_norm: string
          id?: string
          saida_corrigida: string
          saida_original?: string | null
          updated_at?: string
          user_id?: string | null
          votos?: number
        }
        Update: {
          aplicada?: boolean
          contexto?: Json
          created_at?: string
          direcao?: string
          entrada?: string
          entrada_norm?: string
          id?: string
          saida_corrigida?: string
          saida_original?: string | null
          updated_at?: string
          user_id?: string | null
          votos?: number
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          created_at: string
          id: string
          mensagem: string | null
          payload: Json | null
          sinal_id: string | null
          status: string
          tipo: string
          traducao_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem?: string | null
          payload?: Json | null
          sinal_id?: string | null
          status?: string
          tipo: string
          traducao_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string | null
          payload?: Json | null
          sinal_id?: string | null
          status?: string
          tipo?: string
          traducao_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_sinal_id_fkey"
            columns: ["sinal_id"]
            isOneToOne: false
            referencedRelation: "sinais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_traducao_id_fkey"
            columns: ["traducao_id"]
            isOneToOne: false
            referencedRelation: "historico_traducao"
            referencedColumns: ["id"]
          },
        ]
      }
      frases_hospital: {
        Row: {
          categoria: string
          created_at: string
          gloss: string | null
          icone: string | null
          id: string
          ordem: number
          prioridade: number
          texto_pt: string
        }
        Insert: {
          categoria: string
          created_at?: string
          gloss?: string | null
          icone?: string | null
          id?: string
          ordem?: number
          prioridade?: number
          texto_pt: string
        }
        Update: {
          categoria?: string
          created_at?: string
          gloss?: string | null
          icone?: string | null
          id?: string
          ordem?: number
          prioridade?: number
          texto_pt?: string
        }
        Relationships: []
      }
      historico_traducao: {
        Row: {
          confianca: number | null
          contexto: Json | null
          created_at: string
          direcao: string
          entrada: string
          id: string
          saida: string | null
          user_id: string | null
        }
        Insert: {
          confianca?: number | null
          contexto?: Json | null
          created_at?: string
          direcao: string
          entrada: string
          id?: string
          saida?: string | null
          user_id?: string | null
        }
        Update: {
          confianca?: number | null
          contexto?: Json | null
          created_at?: string
          direcao?: string
          entrada?: string
          id?: string
          saida?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inscricoes_novidades: {
        Row: {
          created_at: string
          email: string
          id: string
          interesse: string | null
          nome: string
          origem: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          interesse?: string | null
          nome: string
          origem?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          interesse?: string | null
          nome?: string
          origem?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nome_completo: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome_completo?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string
          updated_at?: string
        }
        Relationships: []
      }
      progresso_educacao: {
        Row: {
          acertos: number
          created_at: string
          erros: number
          id: string
          modulo: string
          payload: Json | null
          tempo_seg: number
          user_id: string
        }
        Insert: {
          acertos?: number
          created_at?: string
          erros?: number
          id?: string
          modulo: string
          payload?: Json | null
          tempo_seg?: number
          user_id: string
        }
        Update: {
          acertos?: number
          created_at?: string
          erros?: number
          id?: string
          modulo?: string
          payload?: Json | null
          tempo_seg?: number
          user_id?: string
        }
        Relationships: []
      }
      ranking_publico: {
        Row: {
          apelido: string
          created_at: string
          id: string
          medalhas: number
          nivel: number
          streak_atual: number
          streak_recorde: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          apelido: string
          created_at?: string
          id?: string
          medalhas?: number
          nivel?: number
          streak_atual?: number
          streak_recorde?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          apelido?: string
          created_at?: string
          id?: string
          medalhas?: number
          nivel?: number
          streak_atual?: number
          streak_recorde?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      sinais: {
        Row: {
          animacao_url: string | null
          aprovado: boolean
          categoria_gramatical: string | null
          categoria_id: string | null
          confianca: number
          contexto_uso: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          exemplos: Json
          fonte: string | null
          id: string
          imagem_url: string | null
          origem: string
          palavra: string
          relacionados: string[]
          significado: string | null
          sinonimos: string[]
          slug: string
          updated_at: string
          variacoes_regionais: Json
          video_url: string | null
        }
        Insert: {
          animacao_url?: string | null
          aprovado?: boolean
          categoria_gramatical?: string | null
          categoria_id?: string | null
          confianca?: number
          contexto_uso?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          exemplos?: Json
          fonte?: string | null
          id?: string
          imagem_url?: string | null
          origem?: string
          palavra: string
          relacionados?: string[]
          significado?: string | null
          sinonimos?: string[]
          slug: string
          updated_at?: string
          variacoes_regionais?: Json
          video_url?: string | null
        }
        Update: {
          animacao_url?: string | null
          aprovado?: boolean
          categoria_gramatical?: string | null
          categoria_id?: string | null
          confianca?: number
          contexto_uso?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          exemplos?: Json
          fonte?: string | null
          id?: string
          imagem_url?: string | null
          origem?: string
          palavra?: string
          relacionados?: string[]
          significado?: string | null
          sinonimos?: string[]
          slug?: string
          updated_at?: string
          variacoes_regionais?: Json
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderador" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderador", "usuario"],
    },
  },
} as const
