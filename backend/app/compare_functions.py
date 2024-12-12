import sympy
from sympy import simplify, expand
from sympy.parsing.latex import parse_latex
import difflib as df
import re


def latex_to_array(array: list, index: int = 0):
    if array[index] is not None and len(array[index].args) >= 2:
        current_expression = array[index]
        del array[index]

        for arg_index in range(len(current_expression.args) - 1, 0, -1):
            array.insert(index, current_expression.args[arg_index])
            latex_to_array(array, index)
            array.insert(index, current_expression.func)

        array.insert(index, current_expression.args[0])
        latex_to_array(array, index)

    elif array[index] is not None and len(array[index].args) == 1:
        array.insert(index, array[index].args[0])
        index += 1
        array[index] = array[index].func
        latex_to_array(array, index - 1)


def indexing_and_stringify(array: list):
    replacements = dict()
    for i in range(len(array)):
        if type(array[i]) == sympy.core.symbol.Symbol:
            if (str(array[i]) not in replacements) and (not str(array[i]).isdigit()):
                replacements[str(array[i])] = "x" + str(len(replacements))
            array[i] = replacements[str(array[i])]
        else:
            array[i] = str(array[i])


def percent(latex1, latex2):
    l1 = [expand(simplify(parse_latex(latex1)))]
    l2 = [expand(simplify(parse_latex(latex2)))]
    latex_to_array(l1, 0)
    latex_to_array(l2, 0)
    indexing_and_stringify(l1)
    indexing_and_stringify(l2)

    s = df.SequenceMatcher(None, l1, l2)
    result = s.get_matching_blocks()
    result = result[:(len(result) - 1)]
    result = [[match.a, match.b, match.size] for match in sorted(result, key=lambda x: x.size, reverse=True)]
    count_match_size = 0
    for i in result:
        count_match_size += i[2]
    result_persentage = count_match_size / max(len(l1), len(l2)) * 100

    return result_persentage


# Работа с индексами #
def split_latex_expression(latex_str):
    # Регулярное выражение для более точного разбиения LaTeX-выражений
    pattern = r'(\\[a-zA-Z]+|\d+\.?\d*|[a-zA-Z]+|[(){}^_]|[\+\-\*/=])'
    tokens = re.findall(pattern, latex_str)
    return tokens


def get_operand_indices(tokens):
    operand_indices = []
    for index, token in enumerate(tokens):
        if re.match(r'^\d+\.?\d*$|^[a-zA-Z]+|^\\[a-zA-Z]+$', token):
            operand_indices.append(index)
    return operand_indices


def abstract_tokens(tokens):
    abstracted_indexed = []
    abstracted = []
    var_map = {}
    var_count = 1

    for token in tokens:
        if re.match(r'^[a-zA-Z]+$', token):
            if token not in var_map:
                var_map[token] = f'VAR{var_count}'
                var_count += 1
            abstracted_indexed.append(var_map[token])
            abstracted.append("VAR")
        else:
            abstracted_indexed.append(token)
            abstracted.append(token)
    return abstracted, abstracted_indexed, var_map


def compare_two_blocks(subtoken1, subtoken2, block, result_block=None):
    if result_block is None:
        result_block = []
    start1 = block[0]
    start2 = block[1]
    print(start1, start2)
    size = block[2]
    result_appendings = []

    var_map1 = {}
    last_index1 = {}
    var_count1 = 0

    var_map2 = {}
    last_index2 = {}
    var_count2 = 0

    for k in range(size):
        if "VAR" in subtoken1[k]:
            if not (subtoken1[k] in var_map1):
                var_map1[subtoken1[k]] = f'VAR{var_count1}'
                var_count1 += 1
            if not (subtoken2[k] in var_map2):
                var_map2[subtoken2[k]] = f'VAR{var_count2}'
                var_count2 += 1
            subtoken1[k] = var_map1[subtoken1[k]]
            subtoken2[k] = var_map2[subtoken2[k]]

            if subtoken1[k] != subtoken2[k]:
                last_index = -1
                if subtoken1[k] in last_index1:
                    last_index = last_index1[subtoken1[k]] + 1
                if subtoken2[k] in last_index2:
                    last_index = max(last_index, last_index2[subtoken2[k]] + 1)
                if k >= 2:
                    result_appendings = [(start1, start2, k)]
                    compare_two_blocks(subtoken1[last_index:], subtoken2[last_index:],
                                       block=(start1 + last_index, start2 + last_index, size - last_index),
                                       result_block=result_appendings)
            last_index1[subtoken1[k]] = k
            last_index2[subtoken2[k]] = k

    if len(result_appendings) != 0:
        for appendings in result_appendings:
            result_block.append(appendings)
    else:
        result_block.append(block)

    return result_block


def find_common_blocks(tokens1, abstracted_tokens1, tokens2, abstracted_tokens2):
    n, m = len(abstracted_tokens1), len(abstracted_tokens2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]

    # Заполняем DP таблицу
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if abstracted_tokens1[i - 1] == abstracted_tokens2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1

    # Найти все уникальные общие блоки
    result = []
    seen_blocks = set()
    i = n
    while i > 0:
        j = m
        while j > 0:
            if dp[i][j] > 0:
                size = dp[i][j]
                if size > 2:
                    start1 = i - size
                    start2 = j - size
                    block = (start1, start2, size)
                    sub_blocks = compare_two_blocks(tokens1[start1:start1 + size], tokens2[start2:start2 + size], block)

                    # Добавляем только если блок еще не покрыт более длинным
                    for sub_block in sub_blocks:
                        if sub_block not in seen_blocks:
                            result.append(sub_block)
                            seen_blocks.add(sub_block)
                i -= size + 1
                j -= size + 1
            j -= 1
        i -= 1
    result.sort(key=lambda x: x[2], reverse=True)
    return result


def find_indexes(formula1: str, formula2: str) -> list[(int, int)]:
    tokens1 = split_latex_expression(formula1)
    tokens2 = split_latex_expression(formula2)
    abstracted1, abstracted_indexed1, var_map1 = abstract_tokens(tokens1)
    abstracted2, abstracted_indexed2, var_map2 = abstract_tokens(tokens2)
    common_blocks = find_common_blocks(abstracted_indexed1, abstracted1, abstracted_indexed2, abstracted2)
    result = []
    for start1, start2, size in common_blocks:
        pre_string = ''.join(tokens1[:start1])
        start_index = len(pre_string) + pre_string.count('\\')
        full_string = ''.join(tokens1[:start1 + size])
        end_index = len(full_string) + full_string.count('\\')
        result.append((start_index, end_index))
    return result

